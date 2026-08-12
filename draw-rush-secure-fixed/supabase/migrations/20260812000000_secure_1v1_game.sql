-- Draw Rush / "خَمِّنها" secure 1v1 game model.
-- All game mutations occur through the RPCs at the end of this migration.
-- Do not create table policies that allow browser INSERT/UPDATE/DELETE access.

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  host_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  current_turn_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  ready boolean not null default false,
  score integer not null default 0 check (score >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (room_id, user_id)
);

create index if not exists players_room_id_idx on public.players(room_id);
create index if not exists players_user_id_idx on public.players(user_id);

-- Image records are created by a trusted content pipeline. object_path names an
-- object in the private `secret-images` bucket; it is never a public URL.
create table if not exists public.secret_images (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique check (object_path !~ '^/' and object_path !~ '\.\.'),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.secret_assignments (
  room_id uuid not null references public.rooms(id) on delete cascade,
  owner_player_id uuid not null references public.players(id) on delete cascade,
  image_id uuid not null references public.secret_images(id) on delete restrict,
  primary key (room_id, owner_player_id),
  unique (room_id, image_id)
);

create table if not exists public.game_turns (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  ordinal smallint not null check (ordinal in (1, 2)),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  ended_at timestamptz,
  end_reason text check (end_reason in ('time_expired')),
  unique (room_id, ordinal),
  check (ends_at = starts_at + interval '60 seconds'),
  check ((ended_at is null and end_reason is null) or (ended_at is not null and end_reason = 'time_expired'))
);

create unique index if not exists one_active_turn_per_room on public.game_turns(room_id) where ended_at is null;

alter table public.rooms
  drop constraint if exists rooms_current_turn_id_fkey,
  add constraint rooms_current_turn_id_fkey foreign key (current_turn_id) references public.game_turns(id) on delete set null;

create table if not exists public.guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  turn_id uuid not null references public.game_turns(id) on delete cascade,
  guessing_player_id uuid not null references public.players(id) on delete restrict,
  guess_text text not null check (char_length(guess_text) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'correct', 'incorrect')),
  judged_by_player_id uuid references public.players(id) on delete restrict,
  judged_at timestamptz,
  score_awarded smallint not null default 0 check (score_awarded in (0, 1)),
  created_at timestamptz not null default clock_timestamp(),
  check (
    (status = 'pending' and judged_by_player_id is null and judged_at is null and score_awarded = 0)
    or
    (status = 'correct' and judged_by_player_id is not null and judged_at is not null and score_awarded = 1)
    or
    (status = 'incorrect' and judged_by_player_id is not null and judged_at is not null and score_awarded = 0)
  )
);

create index if not exists guesses_room_id_idx on public.guesses(room_id, created_at desc);
create index if not exists guesses_pending_idx on public.guesses(id) where status = 'pending';

-- RLS is intentionally deny-by-default. SECURITY DEFINER RPCs below bind the
-- actor to auth.uid(), not a client-provided player_id.
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.secret_images enable row level security;
alter table public.secret_assignments enable row level security;
alter table public.game_turns enable row level security;
alter table public.guesses enable row level security;

create or replace function public.require_authenticated_user()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  return v_user_id;
end;
$$;

create or replace function public.room_id_from_code(p_room_code text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_code text := upper(btrim(coalesce(p_room_code, '')));
begin
  if v_code !~ '^[A-Z0-9]{8}$' then
    raise exception 'Invalid room code' using errcode = '22023';
  end if;

  select id into v_room_id from public.rooms where code = v_code;
  if v_room_id is null then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;
  return v_room_id;
end;
$$;

create or replace function public.current_room_player_id(p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_player_id uuid;
begin
  select p.id into v_player_id
  from public.players p
  where p.room_id = p_room_id
    and p.user_id = public.require_authenticated_user();

  if v_player_id is null then
    raise exception 'Not authorised for this room' using errcode = '42501';
  end if;
  return v_player_id;
end;
$$;

-- The sole transition mechanism for a timed turn. It locks the room, so two
-- concurrent refreshes cannot create two next turns or end the game twice.
create or replace function public.expire_current_turn(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room public.rooms%rowtype;
  v_turn public.game_turns%rowtype;
  v_next_player_id uuid;
  v_next_turn_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.status <> 'playing' or v_room.current_turn_id is null then
    return;
  end if;

  select * into v_turn from public.game_turns where id = v_room.current_turn_id for update;
  if not found or v_turn.ended_at is not null or v_turn.ends_at > v_now then
    return;
  end if;

  update public.game_turns
  set ended_at = v_now, end_reason = 'time_expired'
  where id = v_turn.id and ended_at is null;

  if v_turn.ordinal = 1 then
    select id into v_next_player_id
    from public.players
    where room_id = p_room_id and id <> v_turn.player_id
    order by created_at
    limit 1;

    if v_next_player_id is null then
      raise exception 'A 1v1 game requires exactly two players' using errcode = '23514';
    end if;

    insert into public.game_turns (room_id, player_id, ordinal, starts_at, ends_at)
    values (p_room_id, v_next_player_id, 2, v_now, v_now + interval '60 seconds')
    returning id into v_next_turn_id;

    update public.rooms set current_turn_id = v_next_turn_id where id = p_room_id;
  else
    update public.rooms
    set status = 'finished', current_turn_id = null, finished_at = v_now
    where id = p_room_id;
  end if;
end;
$$;

create or replace function public.get_game_state_sanitized(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid := public.room_id_from_code(p_room_code);
  v_viewer_player_id uuid := public.current_room_player_id(v_room_id);
  v_room public.rooms%rowtype;
  v_players jsonb;
  v_turn jsonb;
  v_visible_secret jsonb;
  v_guesses jsonb;
begin
  perform public.expire_current_turn(v_room_id);
  select * into v_room from public.rooms where id = v_room_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.display_name,
    'score', p.score,
    'isReady', p.ready,
    'isSelf', p.id = v_viewer_player_id,
    'isCurrentTurn', p.id = t.player_id
  ) order by p.created_at), '[]'::jsonb)
  into v_players
  from public.players p
  left join public.game_turns t on t.id = v_room.current_turn_id
  where p.room_id = v_room_id;

  select case when t.id is null then null else jsonb_build_object(
    'id', t.id,
    'playerId', t.player_id,
    'endsAt', t.ends_at,
    'remainingSeconds', greatest(0, ceil(extract(epoch from t.ends_at - clock_timestamp()))::integer),
    'ordinal', t.ordinal
  ) end
  into v_turn
  from public.game_turns t
  where t.id = v_room.current_turn_id;

  select jsonb_build_object('objectPath', si.object_path)
  into v_visible_secret
  from public.secret_assignments sa
  join public.secret_images si on si.id = sa.image_id
  where sa.room_id = v_room_id
    and sa.owner_player_id <> v_viewer_player_id
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'text', g.guess_text,
    'createdAt', g.created_at,
    'status', g.status,
    'isMine', g.guessing_player_id = v_viewer_player_id,
    'points', g.score_awarded
  ) order by g.created_at), '[]'::jsonb)
  into v_guesses
  from public.guesses g
  where g.room_id = v_room_id;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'status', v_room.status,
      'isHost', v_room.host_user_id = public.require_authenticated_user()
    ),
    'players', v_players,
    'turn', v_turn,
    'visibleSecret', v_visible_secret,
    'guesses', v_guesses
  );
end;
$$;

-- Compatibility name retained, but it delegates to the authenticated/sanitised
-- state function. There is no unauthorised room snapshot endpoint.
create or replace function public.get_room_state(p_room_code text)
returns jsonb
language sql
security definer
set search_path = public, auth
as $$ select public.get_game_state_sanitized(p_room_code); $$;

create or replace function public.create_room(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := public.require_authenticated_user();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_room_id uuid;
  v_code text;
  v_attempt smallint;
begin
  if char_length(v_name) not between 1 and 32 or v_name ~ '[[:cntrl:]]' then
    raise exception 'Invalid display name' using errcode = '22023';
  end if;

  for v_attempt in 1..5 loop
    v_code := upper(encode(gen_random_bytes(4), 'hex'));
    begin
      insert into public.rooms (code, host_user_id) values (v_code, v_user_id) returning id into v_room_id;
      exit;
    exception when unique_violation then
      -- Extremely unlikely code collision; retry without exposing internal data.
    end;
  end loop;

  if v_room_id is null then
    raise exception 'Could not allocate room code' using errcode = '40001';
  end if;

  insert into public.players (room_id, user_id, display_name) values (v_room_id, v_user_id, v_name);
  return public.get_game_state_sanitized(v_code);
end;
$$;

create or replace function public.join_room(p_room_code text, p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := public.require_authenticated_user();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_room_id uuid := public.room_id_from_code(p_room_code);
  v_room public.rooms%rowtype;
  v_existing_player_id uuid;
  v_player_count integer;
begin
  if char_length(v_name) not between 1 and 32 or v_name ~ '[[:cntrl:]]' then
    raise exception 'Invalid display name' using errcode = '22023';
  end if;

  select * into v_room from public.rooms where id = v_room_id for update;
  if v_room.status <> 'waiting' then
    raise exception 'This game has already started' using errcode = '55000';
  end if;

  select id into v_existing_player_id from public.players where room_id = v_room_id and user_id = v_user_id;
  if v_existing_player_id is not null then
    return public.get_game_state_sanitized(v_room.code);
  end if;

  select count(*) into v_player_count from public.players where room_id = v_room_id;
  if v_player_count >= 2 then
    raise exception 'Room is full' using errcode = '23514';
  end if;

  insert into public.players (room_id, user_id, display_name) values (v_room_id, v_user_id, v_name);
  return public.get_game_state_sanitized(v_room.code);
end;
$$;

create or replace function public.set_player_ready(p_room_code text, p_ready boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid := public.room_id_from_code(p_room_code);
  v_player_id uuid := public.current_room_player_id(v_room_id);
  v_room public.rooms%rowtype;
begin
  select * into v_room from public.rooms where id = v_room_id for update;
  if v_room.status <> 'waiting' then
    raise exception 'Ready state can only change in the lobby' using errcode = '55000';
  end if;

  update public.players set ready = coalesce(p_ready, false) where id = v_player_id;
  return public.get_game_state_sanitized(v_room.code);
end;
$$;

create or replace function public.start_game(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := public.require_authenticated_user();
  v_room_id uuid := public.room_id_from_code(p_room_code);
  v_room public.rooms%rowtype;
  v_player_ids uuid[];
  v_image_ids uuid[];
  v_turn_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_room from public.rooms where id = v_room_id for update;
  if v_room.host_user_id <> v_user_id then
    raise exception 'Only the room host may start the game' using errcode = '42501';
  end if;
  if v_room.status <> 'waiting' then
    raise exception 'Game has already started' using errcode = '55000';
  end if;

  select array_agg(id order by created_at)
  into v_player_ids
  from public.players
  where room_id = v_room_id
  having count(*) = 2;

  if coalesce(array_length(v_player_ids, 1), 0) <> 2 then
    raise exception 'A room must contain exactly two players' using errcode = '23514';
  end if;
  if not (select bool_and(ready) from public.players where room_id = v_room_id) then
    raise exception 'Both players must be ready' using errcode = '55000';
  end if;

  select array_agg(id)
  into v_image_ids
  from (
    select id from public.secret_images where is_active order by random() limit 2
  ) selected_images;

  if coalesce(array_length(v_image_ids, 1), 0) <> 2 then
    raise exception 'At least two active secret images are required' using errcode = '55000';
  end if;

  insert into public.secret_assignments (room_id, owner_player_id, image_id)
  values
    (v_room_id, v_player_ids[1], v_image_ids[1]),
    (v_room_id, v_player_ids[2], v_image_ids[2]);

  insert into public.game_turns (room_id, player_id, ordinal, starts_at, ends_at)
  values (v_room_id, v_player_ids[1], 1, v_now, v_now + interval '60 seconds')
  returning id into v_turn_id;

  update public.rooms
  set status = 'playing', current_turn_id = v_turn_id, started_at = v_now
  where id = v_room_id;

  return public.get_game_state_sanitized(v_room.code);
end;
$$;

create or replace function public.submit_guess(p_room_code text, p_guess_text text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid := public.room_id_from_code(p_room_code);
  v_player_id uuid := public.current_room_player_id(v_room_id);
  v_room public.rooms%rowtype;
  v_guess text := btrim(coalesce(p_guess_text, ''));
begin
  if char_length(v_guess) not between 1 and 120 or v_guess ~ '[[:cntrl:]]' then
    raise exception 'Invalid guess' using errcode = '22023';
  end if;

  perform public.expire_current_turn(v_room_id);
  select * into v_room from public.rooms where id = v_room_id for update;
  if v_room.status <> 'playing' or v_room.current_turn_id is null then
    raise exception 'There is no active turn' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.game_turns t
    where t.id = v_room.current_turn_id
      and t.player_id = v_player_id
      and t.ended_at is null
      and t.ends_at > clock_timestamp()
  ) then
    raise exception 'Only the active player may submit guesses' using errcode = '42501';
  end if;

  insert into public.guesses (room_id, turn_id, guessing_player_id, guess_text)
  values (v_room_id, v_room.current_turn_id, v_player_id, v_guess);
  -- Deliberately returns no correctness signal: the opponent is the only judge.
end;
$$;

-- Legacy callers can submit a guess through this name, but it is explicitly
-- not an answer oracle. It only acknowledges receipt after submit_guess.
create or replace function public.validate_guess(p_room_code text, p_guess_text text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.submit_guess(p_room_code, p_guess_text);
  return jsonb_build_object('accepted', true);
end;
$$;

create or replace function public.judge_guess(p_guess_id uuid, p_correct boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_guess public.guesses%rowtype;
  v_judge_player_id uuid;
begin
  select * into v_guess from public.guesses where id = p_guess_id for update;
  if not found then
    raise exception 'Guess not found' using errcode = 'P0002';
  end if;
  if v_guess.status <> 'pending' then
    raise exception 'Guess has already been judged' using errcode = '55000';
  end if;

  v_judge_player_id := public.current_room_player_id(v_guess.room_id);
  if v_judge_player_id = v_guess.guessing_player_id then
    raise exception 'A player may not judge their own guess' using errcode = '42501';
  end if;

  update public.guesses
  set status = case when p_correct then 'correct' else 'incorrect' end,
      judged_by_player_id = v_judge_player_id,
      judged_at = clock_timestamp(),
      score_awarded = case when p_correct then 1 else 0 end
  where id = v_guess.id and status = 'pending';

  if not found then
    raise exception 'Guess has already been judged' using errcode = '55000';
  end if;

  if p_correct then
    update public.players set score = score + 1 where id = v_guess.guessing_player_id;
  end if;
  -- No server_validation, answer, or score payload is returned to the caller.
end;
$$;

-- The private Storage bucket is readable only by the player assigned the
-- opponent's image. An object path by itself is not sufficient to read it.
insert into storage.buckets (id, name, public)
values ('secret-images', 'secret-images', false)
on conflict (id) do update set public = false;

create or replace function public.can_view_secret_image(p_object_path text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.secret_images si
    join public.secret_assignments sa on sa.image_id = si.id
    join public.players viewer on viewer.room_id = sa.room_id
    where si.object_path = p_object_path
      and viewer.user_id = auth.uid()
      and viewer.id <> sa.owner_player_id
  );
$$;

drop policy if exists "draw rush opponent secret image read" on storage.objects;
create policy "draw rush opponent secret image read"
on storage.objects for select to authenticated
using (bucket_id = 'secret-images' and public.can_view_secret_image(name));

-- Private Realtime channel policy. Browser code always uses room:<ROOM_CODE>,
-- never room_id. Broadcast messages contain only a refresh signal.
create or replace function public.is_room_code_member(p_room_code text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.rooms r
    join public.players p on p.room_id = r.id
    where r.code = upper(p_room_code) and p.user_id = auth.uid()
  );
$$;

drop policy if exists "draw rush room members receive" on realtime.messages;
create policy "draw rush room members receive"
on realtime.messages for select to authenticated
using (
  realtime.topic() ~ '^room:[A-Z0-9]{8}$'
  and public.is_room_code_member(split_part(realtime.topic(), ':', 2))
);

drop policy if exists "draw rush room members notify" on realtime.messages;
create policy "draw rush room members notify"
on realtime.messages for insert to authenticated
with check (
  realtime.topic() ~ '^room:[A-Z0-9]{8}$'
  and public.is_room_code_member(split_part(realtime.topic(), ':', 2))
);

revoke all on function public.require_authenticated_user() from public;
revoke all on function public.room_id_from_code(text) from public;
revoke all on function public.current_room_player_id(uuid) from public;
revoke all on function public.expire_current_turn(uuid) from public;
revoke all on function public.can_view_secret_image(text) from public;
revoke all on function public.is_room_code_member(text) from public;
revoke all on function public.get_game_state_sanitized(text) from public;
revoke all on function public.get_room_state(text) from public;
revoke all on function public.create_room(text) from public;
revoke all on function public.join_room(text, text) from public;
revoke all on function public.set_player_ready(text, boolean) from public;
revoke all on function public.start_game(text) from public;
revoke all on function public.submit_guess(text, text) from public;
revoke all on function public.validate_guess(text, text) from public;
revoke all on function public.judge_guess(uuid, boolean) from public;

grant execute on function public.get_game_state_sanitized(text) to authenticated;
grant execute on function public.get_room_state(text) to authenticated;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.set_player_ready(text, boolean) to authenticated;
grant execute on function public.start_game(text) to authenticated;
grant execute on function public.submit_guess(text, text) to authenticated;
grant execute on function public.validate_guess(text, text) to authenticated;
grant execute on function public.judge_guess(uuid, boolean) to authenticated;

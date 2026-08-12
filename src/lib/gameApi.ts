import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ServerGameState, ServerGuess, ServerPlayer, ServerTurn } from '../types';
import { requireSupabase } from './supabase';

const ROOM_STORAGE_KEY = 'draw-rush.room-code';
const NAME_STORAGE_KEY = 'draw-rush.guest-name';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`استجابة الخادم لا تحتوي ${field}.`);
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number') throw new Error(`استجابة الخادم لا تحتوي ${field}.`);
  return value;
}

function parsePlayer(value: unknown): ServerPlayer {
  if (!isRecord(value)) throw new Error('استجابة لاعب غير صالحة.');
  return {
    id: requireString(value.id, 'player.id'),
    name: requireString(value.name, 'player.name'),
    score: requireNumber(value.score, 'player.score'),
    isReady: value.isReady === true,
    isSelf: value.isSelf === true,
    isCurrentTurn: value.isCurrentTurn === true,
  };
}

function parseTurn(value: unknown): ServerTurn | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error('استجابة الدور غير صالحة.');
  return {
    id: requireString(value.id, 'turn.id'),
    playerId: requireString(value.playerId, 'turn.playerId'),
    endsAt: requireString(value.endsAt, 'turn.endsAt'),
    remainingSeconds: requireNumber(value.remainingSeconds, 'turn.remainingSeconds'),
    ordinal: requireNumber(value.ordinal, 'turn.ordinal'),
  };
}

function parseGuess(value: unknown): ServerGuess {
  if (!isRecord(value)) throw new Error('استجابة تخمين غير صالحة.');
  const status = requireString(value.status, 'guess.status');
  if (status !== 'pending' && status !== 'correct' && status !== 'incorrect') {
    throw new Error('حالة التخمين غير صالحة.');
  }

  return {
    id: requireString(value.id, 'guess.id'),
    text: requireString(value.text, 'guess.text'),
    createdAt: requireString(value.createdAt, 'guess.createdAt'),
    status,
    isMine: value.isMine === true,
    points: requireNumber(value.points, 'guess.points'),
  };
}

function parseState(value: unknown): ServerGameState {
  if (!isRecord(value) || !isRecord(value.room) || !Array.isArray(value.players) || !Array.isArray(value.guesses)) {
    throw new Error('استجابة حالة اللعبة غير صالحة.');
  }

  const roomStatus = requireString(value.room.status, 'room.status');
  if (roomStatus !== 'waiting' && roomStatus !== 'playing' && roomStatus !== 'finished') {
    throw new Error('حالة الغرفة غير صالحة.');
  }

  let visibleSecret: ServerGameState['visibleSecret'] = null;
  if (value.visibleSecret !== null) {
    if (!isRecord(value.visibleSecret)) throw new Error('استجابة الصورة السرية غير صالحة.');
    visibleSecret = { objectPath: requireString(value.visibleSecret.objectPath, 'visibleSecret.objectPath') };
  }

  return {
    room: {
      id: requireString(value.room.id, 'room.id'),
      code: requireString(value.room.code, 'room.code'),
      status: roomStatus,
      isHost: value.room.isHost === true,
    },
    players: value.players.map(parsePlayer),
    turn: parseTurn(value.turn),
    visibleSecret,
    guesses: value.guesses.map(parseGuess),
  };
}

async function rpcState(name: string, parameters: JsonRecord): Promise<ServerGameState> {
  const client = requireSupabase();
  const { data, error } = await client.rpc(name, parameters);
  if (error) throw new Error(error.message);
  return parseState(data as unknown);
}

export function getGuestName(): string {
  const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
  if (saved) return saved;
  const name = `لاعب ${Math.floor(1000 + Math.random() * 9000)}`;
  window.localStorage.setItem(NAME_STORAGE_KEY, name);
  return name;
}

export async function ensureGuestSession(): Promise<void> {
  const client = requireSupabase();
  const { data: existing } = await client.auth.getSession();
  let session = existing.session;

  if (!session) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error || !data.session) throw new Error(error?.message ?? 'تعذر إنشاء جلسة ضيف.');
    session = data.session;
  }

  client.realtime.setAuth(session.access_token);
}

function writeRoomToUrl(roomCode: string): void {
  window.sessionStorage.setItem(ROOM_STORAGE_KEY, roomCode);
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomCode);
  window.history.replaceState({}, '', url);
}

export function roomCodeFromLocation(): string | null {
  const code = new URL(window.location.href).searchParams.get('room') ?? window.sessionStorage.getItem(ROOM_STORAGE_KEY);
  return code?.trim().toUpperCase() || null;
}

export async function createRoom(): Promise<ServerGameState> {
  const state = await rpcState('create_room', { p_display_name: getGuestName() });
  writeRoomToUrl(state.room.code);
  return state;
}

export async function joinRoom(roomCode: string): Promise<ServerGameState> {
  const state = await rpcState('join_room', { p_room_code: roomCode, p_display_name: getGuestName() });
  writeRoomToUrl(state.room.code);
  return state;
}

export async function getGameState(roomCode: string): Promise<ServerGameState> {
  return rpcState('get_game_state_sanitized', { p_room_code: roomCode });
}

export async function setReady(roomCode: string, ready: boolean): Promise<ServerGameState> {
  return rpcState('set_player_ready', { p_room_code: roomCode, p_ready: ready });
}

export async function startGame(roomCode: string): Promise<ServerGameState> {
  return rpcState('start_game', { p_room_code: roomCode });
}

export async function submitGuess(roomCode: string, text: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('submit_guess', { p_room_code: roomCode, p_guess_text: text.trim() });
  if (error) throw new Error(error.message);
}

export async function judgeGuess(guessId: string, correct: boolean): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('judge_guess', { p_guess_id: guessId, p_correct: correct });
  if (error) throw new Error(error.message);
}

export async function getVisibleSecretUrl(objectPath: string): Promise<string | null> {
  const client = requireSupabase();
  const { data, error } = await client.storage.from('secret-images').createSignedUrl(objectPath, 55);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export function roomChannelTopic(roomCode: string): string {
  return `room:${roomCode}`;
}

export function subscribeToRoom(roomCode: string, onChange: () => void): RealtimeChannel {
  const client = requireSupabase();
  return client
    .channel(roomChannelTopic(roomCode), { config: { private: true } })
    .on('broadcast', { event: 'state_changed' }, onChange)
    .subscribe();
}

export async function broadcastRoomChange(channel: RealtimeChannel | null): Promise<void> {
  if (!channel) return;
  await channel.send({ type: 'broadcast', event: 'state_changed', payload: {} });
}

# Secure-game deployment notes

1. Create a Supabase project, enable **Anonymous sign-ins**, and apply the migration in `supabase/migrations/20260812000000_secure_1v1_game.sql`.
2. Upload at least two opaque, non-guessable object paths to the private `secret-images` Storage bucket using a trusted administrative workflow. Insert the matching paths into `public.secret_images` with an administrator connection. Do not use the browser anon key to upload them.
3. Copy `.env.example` to `.env.local` and set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or a publishable key). Never expose a service-role key.

The client uses `room:<room.code>` private Realtime channels strictly as refresh notifications. Authoritative state, score changes, turn expiry, image visibility, and judging all remain in database RPCs.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Vite only exposes variables prefixed with VITE_.  This client intentionally
// accepts the public anon/publishable key only; server_role keys belong on a
// trusted server and must never be placed in this application.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('إعدادات Supabase غير مكتملة. انسخ .env.example إلى .env.local وأضف القيم العامة فقط.');
  }

  return supabase;
}

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// Vite only exposes variables prefixed with VITE_. This browser client accepts
// the public publishable/anon key only. A service_role or secret key must never
// be placed in browser code, a Vite variable, or a deployed frontend bundle.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

let authInitialization: Promise<Session> | null = null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('إعدادات Supabase غير مكتملة. أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY العامين فقط.');
  }

  return supabase;
}

function synchronizeSession(session: Session): Session {
  // Keep private Realtime channels aligned with the same user JWT that is
  // attached to RPC calls. The Supabase client itself sends this session for
  // REST/RPC requests after auth initialization completes.
  requireSupabase().realtime.setAuth(session.access_token);
  return session;
}

async function readOrCreateAnonymousSession(): Promise<Session> {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client.auth.getSession();
  if (existingError) throw new Error(existingError.message);
  if (existing.session) return synchronizeSession(existing.session);

  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(error?.message ?? 'تعذر إنشاء جلسة ضيف.');
  }

  return synchronizeSession(data.session);
}

/**
 * Starts exactly one restore-or-anonymous-sign-in operation for the whole
 * browser session. This is safe to await concurrently from UI bootstrap and
 * every protected RPC, preventing unauthenticated first requests.
 */
export function initializeAuthSession(): Promise<Session> {
  if (!authInitialization) {
    authInitialization = readOrCreateAnonymousSession().catch((error: unknown) => {
      authInitialization = null;
      throw error;
    });
  }

  return authInitialization;
}

/**
 * Guarantees a current persisted Auth session immediately before a protected
 * call. A refresh restores the session from browser storage; clearing storage
 * creates a replacement anonymous session.
 */
export async function requireAuthenticatedSession(): Promise<Session> {
  await initializeAuthSession();

  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  if (data.session) return synchronizeSession(data.session);

  authInitialization = null;
  return initializeAuthSession();
}

export async function requireAuthenticatedSupabase(): Promise<SupabaseClient> {
  await requireAuthenticatedSession();
  return requireSupabase();
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      synchronizeSession(session);
      authInitialization = Promise.resolve(session);
    } else {
      authInitialization = null;
    }
  });
}

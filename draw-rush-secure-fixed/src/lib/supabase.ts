import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// VITE_SUPABASE_PUBLISHABLE_KEY is the preferred name; retain the anon-key
// spelling for existing Vercel deployments. Both values must be public client
// keys. A service_role or secret key is never accepted by this module.
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
);

const looksLikeServerSecret = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('service_role') || normalized.includes('secret');
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey && !looksLikeServerSecret(supabasePublishableKey),
);

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
    throw new Error('إعدادات Supabase غير مكتملة. أضف VITE_SUPABASE_URL ومفتاح VITE_SUPABASE_PUBLISHABLE_KEY أو VITE_SUPABASE_ANON_KEY العامين فقط.');
  }

  return supabase;
}

async function synchronizeSession(session: Session): Promise<Session> {
  // Keep private Realtime channels aligned with the same user JWT that is
  // attached to RPC calls. Supabase REST/RPC requests also read this session
  // from the Auth client, so synchronization happens before the caller returns.
  await requireSupabase().realtime.setAuth(session.access_token);
  return session;
}

async function readOrCreateAnonymousSession(): Promise<Session> {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client.auth.getSession();
  if (existingError) throw new Error(existingError.message);
  if (existing.session?.user?.id) return synchronizeSession(existing.session);

  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session?.user?.id) {
    throw new Error(error?.message ?? 'تعذر إنشاء جلسة ضيف. تأكد من تفعيل Anonymous Sign-ins في Supabase.');
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
  const initialized = await initializeAuthSession();
  if (!initialized.user?.id || !initialized.access_token) {
    authInitialization = null;
    return initializeAuthSession();
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  if (data.session?.user?.id && data.session.access_token) {
    return synchronizeSession(data.session);
  }

  authInitialization = null;
  return initializeAuthSession();
}

export async function requireAuthenticatedSupabase(): Promise<SupabaseClient> {
  await requireAuthenticatedSession();
  return requireSupabase();
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id && session.access_token) {
      void synchronizeSession(session);
    } else {
      authInitialization = null;
    }
  });
}

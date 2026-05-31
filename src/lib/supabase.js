import { createClient } from '@supabase/supabase-js';
import { getEnvConfig } from '../config/env.js';

const { supabaseUrl, supabaseAnonKey } = getEnvConfig();

const isBrowser = typeof window !== 'undefined';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          ...(isBrowser ? { storage: window.localStorage } : {}),
        },
      })
    : null;

export function isSupabaseAuthConfigured() {
  return Boolean(supabase);
}

/** Current origin without hash — must match Supabase Auth redirect allow list. */
export function getAuthRedirectUrl() {
  if (!isBrowser) return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

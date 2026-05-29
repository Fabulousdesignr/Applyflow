import { createClient } from '@supabase/supabase-js';
import { getEnvConfig } from '../config/env.js';

const { supabaseUrl, supabaseAnonKey } = getEnvConfig();

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function isSupabaseAuthConfigured() {
  return Boolean(supabase);
}

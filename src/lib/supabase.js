import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization (Phase 3)
 * Uses browser-safe anonymous public key ONLY.
 * Never expose SUPABASE_SERVICE_ROLE_KEY in frontend code.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id') &&
      supabaseUrl.startsWith('https://')
  );
};

// Create Supabase client instance
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export default supabase;

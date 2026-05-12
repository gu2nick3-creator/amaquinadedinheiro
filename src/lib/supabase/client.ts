import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { browserEnv } from '@/lib/env';

const SUPABASE_URL = browserEnv.supabaseUrl;
const SUPABASE_ANON_KEY = browserEnv.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase env vars. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deploy provider.',
  );
}

export const supabase = createClient<Database>(SUPABASE_URL || 'https://missing.supabase.co', SUPABASE_ANON_KEY || 'missing-key', {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

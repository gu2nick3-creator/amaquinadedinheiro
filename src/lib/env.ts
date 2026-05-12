export function getBrowserEnv(name: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[name] || '';
}

export const browserEnv = {
  supabaseUrl:
    getBrowserEnv('VITE_SUPABASE_URL') ||
    getBrowserEnv('VITE_MY_SUPABASE_URL'),
  supabaseAnonKey:
    getBrowserEnv('VITE_SUPABASE_ANON_KEY') ||
    getBrowserEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    getBrowserEnv('VITE_MY_SUPABASE_ANON_KEY'),
};

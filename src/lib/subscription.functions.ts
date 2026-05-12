import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type ProfileLike = {
  id?: string;
  email?: string | null;
  plano?: string | null;
  status?: string | null;
  access_expires_at?: string | null;
};

export function isProfileActive(profile: ProfileLike | null | undefined) {
  if (!profile) return false;
  const status = String(profile.status || '').toLowerCase().trim();
  const plan = String(profile.plano || '').toLowerCase().trim();
  const expiresAt = profile.access_expires_at ? new Date(profile.access_expires_at) : null;

  return (
    ['active', 'ativo'].includes(status) &&
    ['pro', 'pró', 'premium'].includes(plan) &&
    !!expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt.getTime() > Date.now()
  );
}

export const getSubscriptionStatusByToken = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.MY_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.MY_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase server env vars missing.');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(data.accessToken);
    if (userError || !userData.user) {
      return { hasValidSubscription: false, profile: null };
    }

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile && userData.user.email) {
      const byEmail = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userData.user.email)
        .maybeSingle();
      profile = byEmail.data;
      error = byEmail.error;
    }

    if (error) throw error;
    return { profile, hasValidSubscription: isProfileActive(profile) };
  });

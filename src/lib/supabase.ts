import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_9LZsLZRp9E34czzgwxKAcg_16Ki63lw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') {
  (window as any).__supabase = supabase;
}

// Automatically synchronize valid authenticated JWT to Realtime WebSocket
// across login, token refresh, and session restoration
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.access_token) {
    try {
      await supabase.realtime.setAuth(session.access_token);
    } catch (err) {
      console.warn('[Supabase Realtime] Automatic setAuth warning:', err);
    }
  } else if (event === 'SIGNED_OUT') {
    try {
      await supabase.realtime.setAuth(null as any);
    } catch {}
  }
});

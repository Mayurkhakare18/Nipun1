import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UseRealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  purpose?: string;
  enabled?: boolean;
  onPayload: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeSubscription({
  table,
  schema = 'public',
  event = '*',
  filter,
  purpose,
  enabled = true,
  onPayload,
}: UseRealtimeSubscriptionOptions) {
  const [status, setStatus] = useState<'IDLE' | 'SUBSCRIBING' | 'SUBSCRIBED' | 'ERROR' | 'CLOSED'>('IDLE');
  const callbackRef = useRef(onPayload);
  callbackRef.current = onPayload;

  useEffect(() => {
    if (!enabled || !table) {
      setStatus('IDLE');
      return;
    }

    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        setStatus('SUBSCRIBING');

        // 1. Ensure current session JWT is passed to Realtime socket
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await supabase.realtime.setAuth(session.access_token);
          }
        } catch (authErr) {
          console.warn('[Supabase Realtime] Pre-subscription auth check notice:', authErr);
        }

        if (!isMounted) return;

        // 2. Stable, deterministic channel identifier based on table, filter, and subscription purpose
        const sanitizedFilter = filter ? filter.replace(/[^a-zA-Z0-9_=.]/g, '_') : 'all';
        const purposeTag = purpose ? `_${purpose}` : '';
        const channelName = `nipun_${schema}_${table}_${sanitizedFilter}${purposeTag}`;

        // If an existing channel with the same name exists, clean it up first to avoid duplicates
        const existingChannels = supabase.getChannels();
        const existing = existingChannels.find((ch) => ch.topic === `realtime:${channelName}` || ch.topic === channelName);
        if (existing) {
          await supabase.removeChannel(existing);
        }

        if (!isMounted) return;

        channel = supabase.channel(channelName);

        const changeConfig: any = {
          event,
          schema,
          table,
        };
        if (filter) {
          changeConfig.filter = filter;
        }

        channel
          .on(
            'postgres_changes' as any,
            changeConfig,
            (payload: RealtimePostgresChangesPayload<any>) => {
              if (isMounted && callbackRef.current) {
                callbackRef.current(payload);
              }
            }
          )
          .subscribe((subscriptionStatus, err) => {
            if (!isMounted) return;

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('SUBSCRIBED');
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('CLOSED');
            } else if (subscriptionStatus === 'CHANNEL_ERROR') {
              console.warn(`[Supabase Realtime] Channel error on ${table}:`, err?.message || '');
              setStatus('ERROR');
            } else if (subscriptionStatus === 'TIMED_OUT') {
              console.warn(`[Supabase Realtime] Channel timed out on ${table}`);
              setStatus('ERROR');
            }
          });
      } catch (err) {
        console.warn(`[Supabase Realtime] Failed to initialize channel for table ${table}:`, err);
        if (isMounted) setStatus('ERROR');
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch((err) => {
          console.warn(`[Supabase Realtime] Cleanup error for channel ${table}:`, err);
        });
      }
      setStatus('CLOSED');
    };
  }, [table, schema, event, filter, purpose, enabled]);

  return { status };
}

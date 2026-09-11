import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UseRealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  enabled?: boolean;
  onPayload: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeSubscription({
  table,
  schema = 'public',
  event = '*',
  filter,
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

        // Deterministic, stable channel name without Date.now() churn
        const sanitizedFilter = filter ? filter.replace(/[^a-zA-Z0-9_=.]/g, '_') : 'all';
        const channelName = `realtime:${schema}:${table}:${sanitizedFilter}`;

        // If an existing channel with the same name exists, remove it cleanly first
        const existingChannels = supabase.getChannels();
        const existingChannel = existingChannels.find((ch) => ch.topic === channelName || ch.topic === `realtime:${channelName}`);
        if (existingChannel) {
          await supabase.removeChannel(existingChannel);
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
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              console.warn(`[Supabase Realtime] Channel status for ${table}:`, subscriptionStatus, err?.message || '');
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
  }, [table, schema, event, filter, enabled]);

  return { status };
}

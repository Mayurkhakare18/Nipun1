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
    let isSubscribed = true;

    try {
      setStatus('SUBSCRIBING');
      const channelName = `realtime_${table}_${filter || 'all'}_${Date.now()}`;

      channel = supabase.channel(channelName);

      channel
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table,
            ...(filter ? { filter } : {}),
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            if (isSubscribed && callbackRef.current) {
              callbackRef.current(payload);
            }
          }
        )
        .subscribe((subscriptionStatus) => {
          if (!isSubscribed) return;
          if (subscriptionStatus === 'SUBSCRIBED') {
            setStatus('SUBSCRIBED');
          } else if (subscriptionStatus === 'CLOSED') {
            setStatus('CLOSED');
          } else if (subscriptionStatus === 'CHANNEL_ERROR') {
            setStatus('ERROR');
          }
        });
    } catch (err) {
      console.warn(`[Supabase Realtime] Failed to initialize channel for table ${table}:`, err);
      setStatus('ERROR');
    }

    return () => {
      isSubscribed = false;
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

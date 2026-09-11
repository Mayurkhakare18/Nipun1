import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dnrqtmadtmgizqdchrbk.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testRealtimeEventDelivery() {
  console.log('====================================================');
  console.log('  TESTING SUPABASE REALTIME POSTGRES_CHANGES EVENT  ');
  console.log('====================================================\n');

  // 1. Create client as authenticated learner Aarav Sharma
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: 'aarav.sharma@mospi.gov.in',
    password: 'Learner@2026',
  });

  if (authError || !authData.session) {
    console.error('Failed to sign in Aarav:', authError);
    process.exit(1);
  }

  const token = authData.session.access_token;
  const userId = authData.user.id;
  console.log(`[AUTH] Signed in Aarav Sharma (UID: ${userId})`);

  // Set auth token on Realtime client
  await client.realtime.setAuth(token);
  console.log('[REALTIME] Set access token on Realtime client');

  // 2. Setup subscription
  let eventReceived = false;
  let receivedPayload: any = null;

  const channel = client.channel(`test_channel_${Date.now()}`);

  const subscriptionPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for SUBSCRIBED status (10s)'));
    }, 10000);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('\n>>> [REALTIME CDC EVENT RECEIVED] <<<');
          console.log('Event Type:', payload.eventType);
          console.log('New Row:', payload.new);
          eventReceived = true;
          receivedPayload = payload;
        }
      )
      .subscribe((status, err) => {
        console.log(`[CHANNEL STATUS] ${status}`, err ? err : '');
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(new Error(`Channel error: ${err?.message || 'unknown'}`));
        }
      });
  });

  console.log('[SUBSCRIBE] Subscribing to public:notifications for user_id=' + userId);
  await subscriptionPromise;
  console.log('[STATUS] Channel is SUBSCRIBED and actively listening!');

  // 3. Insert a record via admin service_role client into PostgreSQL
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const testNotificationId = `test_notif_${Date.now()}`;
  console.log(`\n[POSTGRES] Inserting test notification (${testNotificationId}) into public.notifications...`);

  const { error: insertError } = await adminClient.from('notifications').insert({
    id: testNotificationId,
    user_id: userId,
    title: 'Realtime Verification Test',
    message: 'Testing Supabase Realtime CDC Delivery',
    type: 'ASSIGNMENT',
    read: false,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('Failed to insert test notification:', insertError);
    process.exit(1);
  }
  console.log('[POSTGRES] Row inserted in database. Waiting for WebSocket message...');

  // 4. Wait for event delivery
  const startWait = Date.now();
  while (!eventReceived && Date.now() - startWait < 8000) {
    await new Promise((r) => setTimeout(r, 200));
  }

  // 5. Cleanup test record
  console.log('\n[CLEANUP] Removing test notification from database...');
  await adminClient.from('notifications').delete().eq('id', testNotificationId);
  await client.removeChannel(channel);

  if (eventReceived && receivedPayload?.new?.id === testNotificationId) {
    console.log('\n====================================================');
    console.log(' [VERIFIED] Realtime CDC Event Delivered Successfully! ');
    console.log('====================================================\n');
  } else {
    console.error('\n[FAILED] Did not receive realtime CDC event within timeout.');
    process.exit(1);
  }
}

testRealtimeEventDelivery()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ERROR]', err);
    process.exit(1);
  });

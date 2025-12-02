/**
 * Realtime / Pusher configuration
 *
 * These values are provided by the backend team so both the citizen app
 * and the purok officials app subscribe to the same channels.
 * Only the public key + cluster are needed on the client.
 */

const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'ap1';
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? '8abc068a07e65df34203';

export const realtimeConfig = {
  pusherKey: PUSHER_KEY,
  pusherCluster: PUSHER_CLUSTER,
  citizenChannel: 'citizen-reports',
  citizenReportEvent: 'report.created',
} as const;

export type RealtimeConfig = typeof realtimeConfig;



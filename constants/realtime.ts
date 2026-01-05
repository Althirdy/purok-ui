/**
 * Realtime / Pusher configuration
 *
 * These values are provided by the backend team so both the citizen app
 * and the purok officials app subscribe to the same channels.
 * Only the public key + cluster are needed on the client.
 * 
 * DEVELOPMENT vs PRODUCTION:
 * - Development (mobile testing): Uses ngrok URL via ddev share
 * - Production: Uses https://www.urbanwatch.me
 * 
 * Set EXPO_PUBLIC_API_URL in .env to switch between environments
 */

const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'ap1';
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? '8abc068a07e65df34203';

// Default to ngrok URL for mobile development (ddev share)
// For production, set EXPO_PUBLIC_PUSHER_AUTH_ENDPOINT=https://www.urbanwatch.me/broadcasting/auth
const DEFAULT_AUTH_ENDPOINT = 'https://uniniquitous-semimaturely-amie.ngrok-free.dev/broadcasting/auth';

export const realtimeConfig = {
  pusherKey: PUSHER_KEY,
  pusherCluster: PUSHER_CLUSTER,
  citizenChannel: 'citizen-reports',
  citizenReportEvent: 'report.created',
  purokChannelPrefix: 'private-purok-leader.',
  purokAssignmentEvent: 'concern.assigned',
  authEndpoint: (process.env.EXPO_PUBLIC_PUSHER_AUTH_ENDPOINT ?? DEFAULT_AUTH_ENDPOINT),
} as const;

export type RealtimeConfig = typeof realtimeConfig;



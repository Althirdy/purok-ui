/**
 * Realtime / Pusher configuration
 *
 * These values are provided by the backend team so both the citizen app
 * and the purok officials app subscribe to the same channels.
 * Only the public key + cluster are needed on the client.
 * 
 * DEVELOPMENT vs PRODUCTION:
 * - Development (mobile testing): Set EXPO_PUBLIC_PUSHER_AUTH_ENDPOINT to ngrok URL
 * - Production: Uses https://www.urbanwatch.me (default)
 * 
 * Set EXPO_PUBLIC_PUSHER_AUTH_ENDPOINT in .env to override for development
 */

const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;
const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';
const DEFAULT_AUTH_ENDPOINT = `${API_BASE}/broadcasting/auth`;

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



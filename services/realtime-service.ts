import { realtimeConfig } from '@/constants/realtime';
import type { EmergencyReport, RelatedReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';

const AUTH_TOKEN_KEY = '@urbanwatch:auth_token';

// Related report from Pusher payload (follow-up/duplicate)
type PusherRelatedReport = {
  id: number;
  description: string;
  citizen_name?: string; // May be encrypted
  created_at: string;
  images?: string[];
};

// Payload structure from API documentation
type ConcernAssignedPayload = {
  concern: {
    id: number;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'ongoing' | 'escalated' | 'resolved';
    created_at: string;
    images?: string[];
    audio?: string | null;
    summary?: string | null;
    transcript?: string | null; // Full transcript text (if already processed)
    transcription_status?: 'queued' | 'processing' | 'completed' | 'failed' | null;
    // Support both formats: nested location object OR separate latitude/longitude fields
    latitude?: string | number | null;
    longitude?: string | number | null;
    location?: {
      lat?: string | number | null;
      lng?: string | number | null;
    } | null;
    address?: string | null; // Full address from geocoding
    // Related reports (follow-ups/duplicates merged into this concern)
    relatedReportsCount?: number;
    relatedReports?: PusherRelatedReport[];
  };
  citizen: {
    name: string;
    id?: number;
    phone_number?: string;
  };
  distribution?: {
    id: number;
    status: string;
    assigned_at: string;
  };
};

// Payload structure for status updates
type ConcernStatusUpdatedPayload = {
  concern: {
    id: number;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'ongoing' | 'escalated' | 'resolved';
    created_at: string;
    updated_at?: string;
    images?: string[];
    audio?: string | null;
    summary?: string | null;
    transcript?: string | null;
    transcription_status?: 'queued' | 'processing' | 'completed' | 'failed' | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  };
  distribution?: {
    id: number;
    status: string;
    assigned_at: string;
    updated_at?: string;
  };
  purok_leader?: {
    id: number;
    name: string;
  };
};

type ConcernFollowupDigestPayload = {
  concern: {
    id: number;
    tracking_code: string;
    title: string;
  };
  new_followups: number;
  total_followups: number;
  message?: string;
};

let pusherClient: Pusher | null = null;
let connectionHandlersBound = false;
let lastToken: string | null = null;

// Force disconnect and clear Pusher client (useful when token is refreshed)
export function resetPusherClient() {
  if (pusherClient) {
    console.log('[Pusher] 🔄 Resetting Pusher client (token refreshed)');
    pusherClient.disconnect();
    pusherClient = null;
    connectionHandlersBound = false;
    lastToken = null;
  }
}

async function getPusherClient(authToken?: string): Promise<Pusher> {
  // Get current token from storage if not provided
  if (!authToken) {
    authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
  }

  // If token changed, reset client to force reconnection with new token
  if (pusherClient && lastToken && authToken && lastToken !== authToken) {
    console.log('[Pusher] 🔄 Token changed, resetting client...');
    pusherClient.disconnect();
    pusherClient = null;
    connectionHandlersBound = false;
  }

  // If client exists and is connected, return it
  if (pusherClient && pusherClient.connection.state === 'connected') {
    return pusherClient;
  }

  // If client exists but disconnected, clean it up
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }

  // Store current token
  lastToken = authToken || null;

  Pusher.logToConsole = __DEV__;

  // Token is already retrieved above

  const pusherOptions: any = {
    cluster: realtimeConfig.pusherCluster,
    forceTLS: true,
    encrypted: true,
  };

  // Add authentication for private channels
  // Uses configurable auth endpoint from constants/realtime.ts
  // Development: ngrok URL (ddev share) | Production: www.urbanwatch.me
  // Status 0 = endpoint not reachable, Status 403 = endpoint reachable but auth failed
  if (authToken) {
    // Use custom authorizer function to handle token refresh
    // IMPORTANT: When using authorizer, do NOT set authEndpoint or auth
    // Pusher will use the authorizer function instead
    pusherOptions.authorizer = (channel: any, options: any) => {
      return {
        authorize: async (socketId: string, callback: (err: any, auth: any) => void) => {
          try {
            // Get fresh token from storage
            let currentToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

            if (!currentToken) {
              console.error('[Pusher] ❌ No access token available');
              callback(new Error('No access token available'), null);
              return;
            }

            const authEndpoint = realtimeConfig.authEndpoint;
            console.log('[Pusher] 🔐 Authorizing channel:', channel.name);
            console.log('[Pusher] 📤 Auth endpoint:', authEndpoint);
            console.log('[Pusher] 📤 Socket ID:', socketId);

            // Build form data - Laravel expects application/x-www-form-urlencoded
            const formData = new URLSearchParams();
            formData.append('socket_id', socketId);
            formData.append('channel_name', channel.name);

            // First attempt with current token
            let response = await fetch(authEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                'ngrok-skip-browser-warning': 'true',
              },
              body: formData.toString(),
            });

            // Get response text
            console.log('[Pusher] 📥 Initial response status:', response.status);
            let responseText = await response.text();
            console.log('[Pusher] 📥 Initial response text length:', responseText?.length ?? 0);
            if (responseText && responseText.length > 0) {
              console.log('[Pusher] 📥 Initial response text:', responseText.substring(0, 200));
            }

            const isEmpty = !responseText || responseText.trim().length === 0;

            // Handle empty response or 401 - token expired
            if (isEmpty || response.status === 401) {
              console.log('[Pusher] 🔄 Token expired or empty response (status:', response.status, ', isEmpty:', isEmpty, '), refreshing token...');

              // Try to refresh token
              const refreshToken = await AsyncStorage.getItem('@urbanwatch:refresh_token');
              if (!refreshToken) {
                console.error('[Pusher] ❌ No refresh token available');
                callback(new Error('No refresh token available'), null);
                return;
              }

              const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';
              const refreshResponse = await fetch(`${API_BASE}/api/v1/refresh-token`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${refreshToken}`,
                  'ngrok-skip-browser-warning': 'true',
                },
              });

              if (!refreshResponse.ok) {
                console.error('[Pusher] ❌ Token refresh failed:', refreshResponse.status);
                callback(new Error('Token refresh failed'), null);
                return;
              }

              const refreshData = await refreshResponse.json();
              const data = refreshData?.data ?? refreshData;
              const newAccessToken = data?.token;
              const newRefreshToken = data?.refreshToken;

              if (!newAccessToken) {
                console.error('[Pusher] ❌ Refresh response missing token');
                callback(new Error('Refresh response missing token'), null);
                return;
              }

              // Store new tokens
              await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAccessToken);
              if (newRefreshToken) {
                await AsyncStorage.setItem('@urbanwatch:refresh_token', newRefreshToken);
              }
              currentToken = newAccessToken;
              console.log('[Pusher] ✅ Token refreshed, retrying auth...');

              // Retry auth with new token
              console.log('[Pusher] 🔄 Retrying auth request with new token...');
              console.log('[Pusher] 📤 Auth endpoint:', authEndpoint);
              console.log('[Pusher] 📤 Request body:', formData.toString());

              response = await fetch(authEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${currentToken}`,
                  'ngrok-skip-browser-warning': 'true',
                },
                body: formData.toString(),
              });

              console.log('[Pusher] 📥 Response status:', response.status);
              console.log('[Pusher] 📥 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

              responseText = await response.text();
              console.log('[Pusher] 📥 Response text length:', responseText?.length ?? 0);
              console.log('[Pusher] 📥 Response text:', responseText?.substring(0, 500));
            }

            // Handle non-OK responses
            if (!response.ok) {
              console.error('[Pusher] ❌ Auth failed:', response.status, responseText);
              callback(new Error(`Auth failed: ${response.status}`), null);
              return;
            }

            // Check if response is still empty
            if (!responseText || responseText.trim().length === 0) {
              console.error('[Pusher] ❌ Empty response from auth endpoint');
              console.error('[Pusher] 📥 Response status was:', response.status);
              console.error('[Pusher] 📥 Content-Type:', response.headers.get('content-type'));
              callback(new Error('Empty response from auth endpoint'), null);
              return;
            }

            // Parse and return auth data
            try {
              const authData = JSON.parse(responseText);
              console.log('[Pusher] ✅ Authorization successful for channel:', channel.name);
              callback(null, authData);
            } catch (parseError) {
              console.error('[Pusher] ❌ Failed to parse auth response:', parseError);
              console.error('[Pusher] Response text:', responseText);
              callback(new Error('Invalid JSON in auth response'), null);
            }
          } catch (error: any) {
            console.error('[Pusher] ❌ Auth error:', error);
            callback(error, null);
          }
        },
      };
    };

    console.log('[Pusher] ✅ Custom authorizer configured for endpoint:', realtimeConfig.authEndpoint);
  } else {
    console.warn('[Pusher] ⚠️ No auth token provided - private channel subscription will fail');
  }

  pusherClient = new Pusher(realtimeConfig.pusherKey, pusherOptions);

  // Bind connection state handlers only once
  if (!connectionHandlersBound) {
    pusherClient.connection.bind('connected', () => {
      console.log('[Pusher] Connected to Pusher');
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('[Pusher] Disconnected from Pusher');
    });

    pusherClient.connection.bind('error', (err: any) => {
      console.error('[Pusher] Connection error:', err);
    });

    connectionHandlersBound = true;
  }

  return pusherClient;
}

function normalizeConcernAssigned(payload: ConcernAssignedPayload): EmergencyReport {
  const { concern, citizen } = payload;

  // Validate essential fields to prevent corrupted reports (e.g., PUROK-undefined)
  if (!concern?.id) {
    console.error('[Pusher] ❌ Invalid concern payload: missing concern.id', payload);
    throw new Error('Invalid concern payload: missing concern.id');
  }

  // Log raw payload for debugging
  console.log('[Pusher] 📦 Raw concern payload:', JSON.stringify(concern, null, 2));

  // Map backend category to frontend type
  const categoryMap: Record<string, EmergencyReport['type']> = {
    'safety': 'other',
    'security': 'crime',
    'infrastructure': 'other',
    'environment': 'other',
    'noise': 'other',
    'other': 'other',
    'voice_concern': 'other',
  };

  // Map backend status to frontend status
  const statusMap: Record<string, EmergencyReport['status']> = {
    'pending': 'pending',
    'ongoing': 'acknowledged',
    'escalated': 'acknowledged',
    'resolved': 'resolved',
    'rejected': 'rejected',
  };

  // Parse coordinates - support both formats:
  // 1. Nested: concern.location.lat / concern.location.lng
  // 2. Flat: concern.latitude / concern.longitude
  let coordinates: { latitude: number; longitude: number } | undefined;

  // Try nested location first
  if (concern.location?.lat && concern.location?.lng) {
    const lat = typeof concern.location.lat === 'string' ? parseFloat(concern.location.lat) : concern.location.lat;
    const lng = typeof concern.location.lng === 'string' ? parseFloat(concern.location.lng) : concern.location.lng;
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates = { latitude: lat, longitude: lng };
      console.log('[Pusher] 📍 Parsed nested location:', coordinates);
    }
  }
  // Fallback to flat latitude/longitude
  else if (concern.latitude && concern.longitude) {
    const lat = typeof concern.latitude === 'string' ? parseFloat(concern.latitude) : concern.latitude;
    const lng = typeof concern.longitude === 'string' ? parseFloat(concern.longitude) : concern.longitude;
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates = { latitude: lat, longitude: lng };
      console.log('[Pusher] 📍 Parsed flat location:', coordinates);
    }
  }

  // Build location string - prefer address if available
  let location = 'Location not available';
  if (concern.address) {
    location = concern.address;
    console.log('[Pusher] 📍 Using address:', location);
  } else if (coordinates) {
    location = `Lat ${coordinates.latitude.toFixed(4)}, Lng ${coordinates.longitude.toFixed(4)}`;
    console.log('[Pusher] 📍 Using coordinates as location:', location);
  }

  const category = concern.category?.toLowerCase() || 'other';

  // Parse related reports (follow-ups/duplicates)
  const relatedReports: RelatedReport[] | undefined = concern.relatedReports?.map((r) => ({
    id: r.id,
    description: r.description,
    citizen_name: r.citizen_name,
    created_at: r.created_at,
    images: r.images,
  }));

  return {
    id: `PUROK-${concern.id}`, // Format: PUROK-{id} to match API format and enable status updates
    title: concern.title,
    description: concern.description || concern.summary || 'No description available',
    type: categoryMap[category] ?? 'other',
    location,
    severity: concern.severity ?? 'medium',
    status: statusMap[concern.status] ?? 'pending',
    timestamp: new Date(concern.created_at),
    source: 'citizen',
    reportedBy: citizen.name ?? 'citizen',
    images: concern.images ?? [],
    coordinates,
    originalCategory: category, // Preserve original category for display
    // Voice transcription details (for voice concerns)
    transcript: concern.transcript ?? concern.summary ?? null,
    transcriptionStatus: concern.transcription_status ?? undefined,
    // Related reports (follow-ups/duplicates)
    relatedReportsCount: concern.relatedReportsCount ?? 0,
    relatedReports: relatedReports,
  };
}

/**
 * Subscribe to private purok leader channel for real-time concern assignments
 * 
 * Channel: private-purok-leader.{userId}
 * Event: concern.assigned
 * 
 * The frontend dynamically subscribes to the channel based on the logged-in user's ID.
 * The backend should broadcast to the channel matching the assigned purok leader's ID.
 * 
 * @param userId - The purok leader's user ID (from authenticated user)
 * @param authToken - The authentication token for private channel authorization
 * @param onReport - Callback when a new concern is assigned
 */
export async function subscribeToCitizenReports(
  userId: number | string,
  authToken: string,
  onReport: (report: EmergencyReport) => void,
  onFollowupDigest?: (reportId: string, newFollowups: number, totalFollowups: number) => void
): Promise<() => void> {
  try {
    const client = await getPusherClient(authToken);

    // Channel name: private-purok-leader.{userId}
    // Laravel automatically prepends 'private-' for private channels
    const channelName = `private-purok-leader.${userId}`;
    console.log('[Pusher] Subscribing to channel:', channelName);

    const channel = client.subscribe(channelName);

    // Wait for subscription to be successful
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Successfully subscribed to', channelName);
      console.log('[Pusher] ✅ Ready to receive real-time concerns from uw-citizen');
    });

    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] Subscription error:', err);
      console.error('[Pusher] Error details:', {
        error: err?.error,
        status: err?.status,
        type: err?.type,
        channel: channelName,
        userId: userId,
      });

      // Status 403 means endpoint is reachable but authorization failed
      if (err?.status === 403) {
        console.error('[Pusher] 403 Forbidden - Authorization failed');
        console.error('  Possible causes:');
        console.error('  1. Auth token is invalid or expired');
        console.error('  2. User ID mismatch - user cannot access this channel');
        console.error('  3. Backend authorization logic rejecting the request');
        console.error('  4. Channel name format mismatch');
        console.error(`  Channel: ${channelName}`);
        console.error(`  User ID: ${userId}`);
      }

      // Status 0 usually means network/CORS issue
      if (err?.status === 0) {
        console.error('[Pusher] Status 0 error - Network/CORS issue');
        console.error('  Check:');
        console.error('  1. Is /broadcasting/auth endpoint accessible?');
        console.error('  2. Is CORS configured correctly on backend?');
        console.error('  3. Is the endpoint path correct?');
      }
    });

    // Event name: concern.assigned
    // Per documentation: Use .concern.assigned (with leading dot) for client-named events
    const eventName = `.${realtimeConfig.purokAssignmentEvent}`; // Note the leading dot for client-named events
    const digestEventName = `.${realtimeConfig.purokFollowupDigestEvent}`;

    const handler = (data: ConcernAssignedPayload) => {
      try {
        console.log('[Pusher] 🔔 New Concern Received from uw-citizen:', {
          concernId: data.concern.id,
          title: data.concern.title,
          citizen: data.citizen.name,
          category: data.concern.category,
          severity: data.concern.severity,
        });
        const normalized = normalizeConcernAssigned(data);
        console.log('[Pusher] ✅ Normalized report:', normalized.id);
        onReport(normalized);

        // Per documentation: Example usage
        // if (data.concern.audio) {
        //   playAudio(data.concern.audio);
        // }
        // Alert.alert('New Concern', `${data.citizen.name} reported: ${data.concern.title}`);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to normalize concern:', error, data);
      }
    };

    // Bind to client-named event (per documentation)
    channel.bind(eventName, handler);

    const digestHandler = (data: ConcernFollowupDigestPayload) => {
      try {
        const reportId = `PUROK-${data.concern.id}`;
        console.log('[Pusher] 📊 Follow-up digest received:', {
          reportId,
          new_followups: data.new_followups,
          total_followups: data.total_followups,
        });
        onFollowupDigest?.(reportId, data.new_followups, data.total_followups);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process follow-up digest:', error, data);
      }
    };

    channel.bind(digestEventName, digestHandler);

    return () => {
      console.log('[Pusher] Unsubscribing from', channelName);
      channel.unbind(eventName, handler);
      channel.unbind(digestEventName, digestHandler);
      client.unsubscribe(channelName);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up subscription:', error);
    // Return a no-op cleanup function
    return () => { };
  }
}

/**
 * Payload for accident status updates from CCTV system
 * Channel: active-accidents (public channel)
 * Event: accident.status.updated
 */
type AccidentStatusUpdatedPayload = {
  id: number;
  latitude: string | number;
  longitude: string | number;
  accidentType: string;
  severity: string;
  status: string; // 'Pending', 'In Progress', 'Resolved'
  title: string;
  occuredAt: string; // "2 hours ago" format
};

/**
 * Subscribe to CCTV accident status updates
 * 
 * Channel: active-accidents (PUBLIC channel)
 * Event: accident.status.updated
 * 
 * Broadcasts when Operator acknowledges/resolves an accident.
 * Used to update map markers in real-time.
 * 
 * @param onAccidentUpdate - Callback when accident status changes
 */
export async function subscribeToAccidentStatusUpdates(
  onAccidentUpdate: (accident: AccidentStatusUpdatedPayload) => void
): Promise<() => void> {
  try {
    const client = await getPusherClient();

    // Public channel - no authentication needed
    const channelName = 'active-accidents';
    console.log('[Pusher] Subscribing to accident updates on channel:', channelName);

    const channel = client.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Subscribed to accident updates on', channelName);
    });

    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] ❌ Accident subscription error:', err);
    });

    // Event handler for accident status updates
    const handler = (data: AccidentStatusUpdatedPayload) => {
      try {
        console.log('[Pusher] 🚗 Accident Status Update:', {
          id: data.id,
          status: data.status,
          title: data.title,
          type: data.accidentType,
        });
        onAccidentUpdate(data);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process accident update:', error);
      }
    };

    // Bind to the event (both with and without leading dot for safety)
    channel.bind('.accident.status.updated', handler);
    channel.bind('accident.status.updated', handler);

    console.log('[Pusher] ✅ Listening for accident.status.updated events');

    return () => {
      console.log('[Pusher] Unsubscribing from accident updates');
      channel.unbind('.accident.status.updated', handler);
      channel.unbind('accident.status.updated', handler);
      client.unsubscribe(channelName);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up accident subscription:', error);
    return () => { };
  }
}

/**
 * Subscribe to status update events for concerns
 * 
 * Channel: private-purok-leader.{userId}
 * Event: concern.status.updated or concern.updated
 * 
 * This listens for status updates that happen when:
 * - Purok leader acknowledges/resolves a concern (via app or Postman)
 * - Backend broadcasts the update back to the purok leader's channel
 * 
 * @param userId - The purok leader's user ID
 * @param authToken - The authentication token
 * @param onStatusUpdate - Callback when a concern status is updated
 */
export async function subscribeToStatusUpdates(
  userId: number | string,
  authToken: string,
  onStatusUpdate: (reportId: string, status: 'pending' | 'acknowledged' | 'resolved' | 'rejected') => void
): Promise<() => void> {
  try {
    const client = await getPusherClient(authToken);

    const channelName = `private-purok-leader.${userId}`;
    console.log('[Pusher] Subscribing to status updates on channel:', channelName);

    const channel = client.subscribe(channelName);

    // Debug: Listen to ALL events on this channel to see what backend is broadcasting
    if (__DEV__) {
      const debugHandler = (eventName: string, data: any) => {
        console.log('[Pusher] 🔍 DEBUG - Event received on channel:', {
          channel: channelName,
          event: eventName,
          data: data ? JSON.stringify(data, null, 2) : 'null',
        });
      };

      // Bind to all events (Pusher doesn't have a wildcard, so we'll log subscription events)
      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[Pusher] ✅ Status update subscription succeeded on', channelName);
      });

      channel.bind('pusher:subscription_error', (err: any) => {
        console.error('[Pusher] ❌ Status update subscription error:', err);
      });
    }

    // Map backend status to frontend status
    const statusMap: Record<string, EmergencyReport['status']> = {
      'pending': 'pending',
      'ongoing': 'acknowledged',
      'escalated': 'acknowledged',
      'resolved': 'resolved',
      'rejected': 'rejected',
    };

    // Listen for concern.status.updated event
    const statusUpdateHandler = (data: ConcernStatusUpdatedPayload) => {
      try {
        console.log('[Pusher] 📨 Raw status update event received:', {
          event: 'concern.status.updated or concern.updated',
          data: JSON.stringify(data, null, 2),
        });

        const concernId = data.concern.id;
        // Priority: distribution.status > concern.status (backend updates distribution_status)
        const backendStatus = data.distribution?.status || data.concern.status || 'pending';
        const frontendStatus = statusMap[backendStatus.toLowerCase()] || 'pending';

        console.log('[Pusher] 🔄 Status Update Processed:', {
          concernId,
          backendStatus,
          frontendStatus,
          title: data.concern.title,
          distributionStatus: data.distribution?.status,
          concernStatus: data.concern.status,
        });

        // Call callback with report ID (format: PUROK-{id}) and frontend status
        onStatusUpdate(`PUROK-${concernId}`, frontendStatus);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process status update:', error);
        console.error('[Pusher] ❌ Event data:', JSON.stringify(data, null, 2));
      }
    };

    // Bind to both possible event names (with and without leading dot)
    // Client-named events use leading dot (e.g., .concern.status.updated)
    // Server-named events don't use leading dot (e.g., concern.status.updated)
    channel.bind('.concern.status.updated', statusUpdateHandler);
    channel.bind('concern.status.updated', statusUpdateHandler);
    channel.bind('.concern.updated', statusUpdateHandler);
    channel.bind('concern.updated', statusUpdateHandler);

    console.log('[Pusher] ✅ Listening for status updates on', channelName);
    console.log('[Pusher] ✅ Listening for events: .concern.status.updated, concern.status.updated, .concern.updated, concern.updated');

    return () => {
      console.log('[Pusher] Unsubscribing from status updates on', channelName);
      channel.unbind('.concern.status.updated', statusUpdateHandler);
      channel.unbind('concern.status.updated', statusUpdateHandler);
      channel.unbind('.concern.updated', statusUpdateHandler);
      channel.unbind('concern.updated', statusUpdateHandler);
      // Note: Don't unsubscribe from channel here - it might be used by other subscriptions
    };
  } catch (error) {
    console.error('[Pusher] Error setting up status update subscription:', error);
    return () => { };
  }
}

// ============================================================================
// Anomaly Logs Real-time Subscription
// ============================================================================

// Anomaly created event payload from WebSocket
type AnomalyCreatedPayload = {
  id: number;
  device_id?: string;
  anomaly_type: 'sound_anomaly' | 'anti_tampering';
  anomaly_type_label: string;
  image?: string;
  details?: Array<{
    vibration?: string;
    mic_left?: string;
    mic_right?: string;
    hall_effect?: string;
    audio_floor?: string;
    people_detected?: string;
  }>;
  is_confirmed: boolean;
  iot_box: {
    id: number;
    device_name?: string;       // WebSocket payload field
    display_location?: string;  // WebSocket payload field (combined location)
    name?: string;              // Alternative field
    location_name?: string;     // From nested location object
    location?: string;          // Alternative field
    barangay?: string;          // Barangay name from API
    latitude?: string;
    longitude?: string;
    is_online?: boolean;
  };
  location?: {
    id: number;
    location_name: string;
    barangay: string;
  };
  created_at: string;
};

/**
 * Subscribe to anomaly created events on the public anomaly-logs channel
 * 
 * Channel: anomaly-logs (public)
 * Event: anomaly.created
 * 
 * @param onAnomalyCreated - Callback when a new anomaly is detected
 * @returns Unsubscribe function
 */
export async function subscribeToAnomalyLogs(
  onAnomalyCreated: (anomaly: AnomalyCreatedPayload) => void
): Promise<() => void> {
  try {
    const pusher = await getPusherClient();
    const channelName = 'anomaly-logs';

    console.log('[Pusher] 🔔 Subscribing to anomaly logs channel:', channelName);

    // Subscribe to public channel (no auth required)
    const channel = pusher.subscribe(channelName);

    // Handle subscription success
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Successfully subscribed to', channelName);
    });

    // Handle subscription error
    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] ❌ Failed to subscribe to', channelName, err);
    });

    // Anomaly created event handler
    const anomalyCreatedHandler = (data: AnomalyCreatedPayload) => {
      try {
        console.log('[Pusher] 🚨 New anomaly detected:', {
          id: data.id,
          type: data.anomaly_type,
          label: data.anomaly_type_label,
          iotBox: data.iot_box?.device_name || data.iot_box?.name || `Device ${data.iot_box?.id}`,
          location: data.iot_box?.display_location || data.location?.location_name,
        });

        onAnomalyCreated(data);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process anomaly event:', error);
      }
    };

    // Bind to both event name formats (with and without leading dot)
    channel.bind('.anomaly.created', anomalyCreatedHandler);
    channel.bind('anomaly.created', anomalyCreatedHandler);

    console.log('[Pusher] ✅ Listening for anomaly events on', channelName);

    return () => {
      console.log('[Pusher] Unsubscribing from anomaly logs channel:', channelName);
      channel.unbind('.anomaly.created', anomalyCreatedHandler);
      channel.unbind('anomaly.created', anomalyCreatedHandler);
      pusher.unsubscribe(channelName);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up anomaly subscription:', error);
    return () => { };
  }
}

// Export the anomaly payload type for consumers
export type { AnomalyCreatedPayload };

// ============================================================================
// Safety Post / Public Announcements Real-time Subscription
// ============================================================================

// Safety Post published event payload from WebSocket
// Channel: public-posts (public)
// Event: safety-post.published
export type SafetyPostPublishedPayload = {
  id: number;
  title: string;
  content: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  author?: {
    id: number;
    name: string;
  };
  image?: string | null;
  published_at: string;
  created_at: string;
};

/**
 * Subscribe to public safety post events on the public-posts channel
 * 
 * Channel: public-posts (public)
 * Event: safety-post.published
 * 
 * This is a public channel, no authentication required.
 * Used to notify users when new safety posts/announcements are published.
 * 
 * @param onSafetyPostPublished - Callback when a new safety post is published
 * @returns Unsubscribe function
 */
export async function subscribeToPublicPosts(
  onSafetyPostPublished: (post: SafetyPostPublishedPayload) => void
): Promise<() => void> {
  try {
    const pusher = await getPusherClient();
    const channelName = 'public-posts';

    console.log('[Pusher] 📢 Subscribing to public posts channel:', channelName);

    // Subscribe to public channel (no auth required)
    const channel = pusher.subscribe(channelName);

    // Handle subscription success
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Successfully subscribed to', channelName);
    });

    // Handle subscription error
    channel.bind('pusher:subscription_error', (err: any) => {
      console.error('[Pusher] ❌ Failed to subscribe to', channelName, err);
    });

    // Safety post published event handler
    const safetyPostPublishedHandler = (data: SafetyPostPublishedPayload) => {
      try {
        console.log('[Pusher] 📢 New safety post published:', {
          id: data.id,
          title: data.title,
          category: data.category,
          severity: data.severity,
          author: data.author?.name || 'Unknown',
        });

        onSafetyPostPublished(data);
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process safety post event:', error);
      }
    };

    // Bind to both event name formats (with and without leading dot)
    channel.bind('.safety-post.published', safetyPostPublishedHandler);
    channel.bind('safety-post.published', safetyPostPublishedHandler);

    console.log('[Pusher] ✅ Listening for safety-post.published events on', channelName);

    return () => {
      console.log('[Pusher] Unsubscribing from public posts channel:', channelName);
      channel.unbind('.safety-post.published', safetyPostPublishedHandler);
      channel.unbind('safety-post.published', safetyPostPublishedHandler);
      pusher.unsubscribe(channelName);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up safety post subscription:', error);
    return () => { };
  }
}


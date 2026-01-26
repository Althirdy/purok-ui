import { realtimeConfig } from '@/constants/realtime';
import { API_BASE } from '@/lib/axios';
import type { EmergencyReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';
import { scheduleNotification } from '@/services/notifications';

const AUTH_TOKEN_KEY = '@urbanwatch:auth_token';

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

// Payload structure for AI category updates (silent UI update)
type ConcernAiCategoryUpdatedPayload = {
  id: number;
  category: string;
  severity: string;
  aiCategory: string | null;
  aiSeverity: string | null;
  aiConfidence: number | null;
  aiProcessedAt: string | null;
  updatedAt: string | null;
};

// Payload structure for transcription updates (silent UI update)
type ConcernTranscribedPayload = {
  id: number;
  title: string;
  description: string;
  transcriptText: string | null;
  status: string;
  updatedAt: string;
};

// Payload structure for concern merged events
type ConcernMergedPayload = {
  duplicateConcernId: number;
  parentConcern: {
    id: number;
    trackingCode: string;
    title: string;
    category: string;
    status: string;
  };
  message: string;
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

            // First attempt with current token
            let response = await fetch(authEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                'ngrok-skip-browser-warning': 'true',
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            });

            // Get response text
            let responseText = await response.text();
            const isEmpty = !responseText || responseText.trim().length === 0;

            // Handle empty response or 401 - token expired
            if (isEmpty || response.status === 401) {
              console.log('[Pusher] 🔄 Token expired or empty response, refreshing token...');

              // Try to refresh token
              const refreshToken = await AsyncStorage.getItem('@urbanwatch:refresh_token');
              if (!refreshToken) {
                console.error('[Pusher] ❌ No refresh token available');
                callback(new Error('No refresh token available'), null);
                return;
              }


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
              response = await fetch(authEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${currentToken}`,
                  'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              });

              responseText = await response.text();
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
  onReport: (report: EmergencyReport) => void
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
    const eventName = '.concern.assigned'; // Note the leading dot for client-named events

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

        // Explicitly trigger native notification with sound
        scheduleNotification(
          `New ${normalized.originalCategory || 'Incident'} Assigned`,
          `${normalized.title}\n📍 ${normalized.location}`,
          { reportId: normalized.id }
        );

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

    return () => {
      console.log('[Pusher] Unsubscribing from', channelName);
      channel.unbind(eventName, handler);
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
  onStatusUpdate: (reportId: string, status: 'pending' | 'acknowledged' | 'resolved') => void
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
    const statusMap: Record<string, 'pending' | 'acknowledged' | 'resolved'> = {
      'pending': 'pending',
      'ongoing': 'acknowledged',
      'escalated': 'acknowledged',
      'resolved': 'resolved',
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


/**
 * Subscribe to AI category update events (silent UI update)
 * 
 * Channel: private-purok-leader.{userId}
 * Event: concern.ai.category.updated
 * 
 * This event fires when the AI finishes categorizing a concern.
 * The UI should update the category/severity without showing a toast.
 * 
 * @param userId - The purok leader's user ID
 * @param authToken - The authentication token
 * @param onAiCategoryUpdate - Callback with concern ID and updated AI data
 */
export async function subscribeToAiCategoryUpdates(
  userId: number | string,
  authToken: string,
  onAiCategoryUpdate: (
    reportId: string,
    data: {
      category: string;
      severity: string;
      aiCategory: string | null;
      aiSeverity: string | null;
      aiConfidence: number | null;
    }
  ) => void
): Promise<() => void> {
  try {
    const client = await getPusherClient(authToken);
    const channelName = `private-purok-leader.${userId}`;

    console.log('[Pusher] Subscribing to AI category updates on channel:', channelName);
    const channel = client.subscribe(channelName);

    const aiCategoryHandler = (data: ConcernAiCategoryUpdatedPayload) => {
      try {
        console.log('[Pusher] 🤖 AI Category Update received (silent):', {
          concernId: data.id,
          category: data.category,
          aiCategory: data.aiCategory,
          aiSeverity: data.aiSeverity,
        });

        onAiCategoryUpdate(`PUROK-${data.id}`, {
          category: data.category,
          severity: data.severity,
          aiCategory: data.aiCategory,
          aiSeverity: data.aiSeverity,
          aiConfidence: data.aiConfidence,
        });
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process AI category update:', error);
      }
    };

    // Bind to both event name formats
    channel.bind('.concern.ai.category.updated', aiCategoryHandler);
    channel.bind('concern.ai.category.updated', aiCategoryHandler);

    console.log('[Pusher] ✅ Listening for AI category updates');

    return () => {
      console.log('[Pusher] Unsubscribing from AI category updates');
      channel.unbind('.concern.ai.category.updated', aiCategoryHandler);
      channel.unbind('concern.ai.category.updated', aiCategoryHandler);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up AI category subscription:', error);
    return () => { };
  }
}


/**
 * Subscribe to transcription update events (silent UI update)
 * 
 * Channel: private-purok-leader.{userId}
 * Event: concern.transcribed
 * 
 * This event fires when the AI finishes transcribing a voice concern.
 * The UI should update the transcript text without showing a toast.
 * 
 * @param userId - The purok leader's user ID
 * @param authToken - The authentication token
 * @param onTranscriptionUpdate - Callback with concern ID and transcript data
 */
export async function subscribeToTranscriptionUpdates(
  userId: number | string,
  authToken: string,
  onTranscriptionUpdate: (
    reportId: string,
    data: {
      title: string;
      description: string;
      transcriptText: string | null;
    }
  ) => void
): Promise<() => void> {
  try {
    const client = await getPusherClient(authToken);
    const channelName = `private-purok-leader.${userId}`;

    console.log('[Pusher] Subscribing to transcription updates on channel:', channelName);
    const channel = client.subscribe(channelName);

    const transcriptionHandler = (data: ConcernTranscribedPayload) => {
      try {
        console.log('[Pusher] 🎤 Transcription Update received (silent):', {
          concernId: data.id,
          title: data.title,
          hasTranscript: !!data.transcriptText,
        });

        onTranscriptionUpdate(`PUROK-${data.id}`, {
          title: data.title,
          description: data.description,
          transcriptText: data.transcriptText,
        });
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process transcription update:', error);
      }
    };

    // Bind to both event name formats
    channel.bind('.concern.transcribed', transcriptionHandler);
    channel.bind('concern.transcribed', transcriptionHandler);

    console.log('[Pusher] ✅ Listening for transcription updates');

    return () => {
      console.log('[Pusher] Unsubscribing from transcription updates');
      channel.unbind('.concern.transcribed', transcriptionHandler);
      channel.unbind('concern.transcribed', transcriptionHandler);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up transcription subscription:', error);
    return () => { };
  }
}


/**
 * Subscribe to concern merged events
 * 
 * Channel: private-purok-leader.{userId}
 * Event: concern.merged
 * 
 * This event fires when a new concern is identified as a duplicate 
 * and merged into an existing parent concern.
 * 
 * NOTE: This broadcasts to the CITIZEN's channel, not the purok leader's.
 * For purok leaders, this would be handled internally (no duplicate reports shown).
 * We include this for completeness in case the channel routing changes.
 * 
 * @param userId - The purok leader's user ID
 * @param authToken - The authentication token
 * @param onConcernMerged - Callback with duplicate ID and parent concern info
 */
export async function subscribeToConcernMerged(
  userId: number | string,
  authToken: string,
  onConcernMerged: (
    duplicateId: string,
    parentConcern: {
      id: number;
      trackingCode: string;
      title: string;
      category: string;
      status: string;
    },
    message: string
  ) => void
): Promise<() => void> {
  try {
    const client = await getPusherClient(authToken);
    const channelName = `private-purok-leader.${userId}`;

    console.log('[Pusher] Subscribing to concern merged events on channel:', channelName);
    const channel = client.subscribe(channelName);

    const mergedHandler = (data: ConcernMergedPayload) => {
      try {
        console.log('[Pusher] 🔀 Concern Merged event received:', {
          duplicateId: data.duplicateConcernId,
          parentId: data.parentConcern.id,
          parentTrackingCode: data.parentConcern.trackingCode,
        });

        onConcernMerged(
          `PUROK-${data.duplicateConcernId}`,
          data.parentConcern,
          data.message
        );
      } catch (error) {
        console.error('[Pusher] ❌ Failed to process concern merged event:', error);
      }
    };

    // Bind to both event name formats
    channel.bind('.concern.merged', mergedHandler);
    channel.bind('concern.merged', mergedHandler);

    console.log('[Pusher] ✅ Listening for concern merged events');

    return () => {
      console.log('[Pusher] Unsubscribing from concern merged events');
      channel.unbind('.concern.merged', mergedHandler);
      channel.unbind('concern.merged', mergedHandler);
    };
  } catch (error) {
    console.error('[Pusher] Error setting up concern merged subscription:', error);
    return () => { };
  }
}

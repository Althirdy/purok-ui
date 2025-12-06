import { realtimeConfig } from '@/constants/realtime';
import type { EmergencyReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';

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
    transcript?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
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

let pusherClient: Pusher | null = null;
let connectionHandlersBound = false;

async function getPusherClient(authToken?: string): Promise<Pusher> {
  // If client exists and is connected, return it
  if (pusherClient && pusherClient.connection.state === 'connected') {
    return pusherClient;
  }

  // If client exists but disconnected, clean it up
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }

  Pusher.logToConsole = __DEV__;

  // Get auth token if not provided
  if (!authToken) {
    authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
  }

  const pusherOptions: any = {
    cluster: realtimeConfig.pusherCluster,
    forceTLS: true,
    encrypted: true,
  };

  // Add authentication for private channels
  // Use www.urbanwatch.me to match the API base URL (https://www.urbanwatch.me)
  // Status 0 = endpoint not reachable, Status 403 = endpoint reachable but auth failed
  if (authToken) {
    pusherOptions.authEndpoint = 'https://www.urbanwatch.me/broadcasting/auth';
    pusherOptions.auth = {
      headers: {
        'Authorization': `Bearer ${authToken}`, // Pass the logged-in user's Sanctum token
        'Accept': 'application/json',
      },
    };
    console.log('[Pusher] Configuring auth endpoint:', pusherOptions.authEndpoint);
    console.log('[Pusher] Auth token present:', !!authToken);
  } else {
    console.warn('[Pusher] No auth token provided - private channel subscription will fail');
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

  // Parse coordinates
  let coordinates: { latitude: number; longitude: number } | undefined;
  if (concern.latitude && concern.longitude) {
    const lat = typeof concern.latitude === 'string' ? parseFloat(concern.latitude) : concern.latitude;
    const lng = typeof concern.longitude === 'string' ? parseFloat(concern.longitude) : concern.longitude;
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates = { latitude: lat, longitude: lng };
    }
  }

  // Build location string
  const locationParts: string[] = [];
  if (coordinates) {
    locationParts.push(`Lat ${coordinates.latitude.toFixed(4)}, Lng ${coordinates.longitude.toFixed(4)}`);
  }
  if (citizen.name) {
    locationParts.push(`Reported by ${citizen.name}`);
  }
  const location = locationParts.length > 0 ? locationParts.join(' • ') : 'Citizen submitted location';

  return {
    id: `PUROK-${concern.id}`, // Format: PUROK-{id} to match API format and enable status updates
    title: concern.title,
    description: concern.description || concern.summary || 'No description available',
    type: categoryMap[concern.category?.toLowerCase()] ?? 'other',
    location,
    severity: concern.severity ?? 'medium',
    status: statusMap[concern.status] ?? 'pending',
    timestamp: new Date(concern.created_at),
    source: 'citizen',
    reportedBy: citizen.name ?? 'citizen',
    images: concern.images ?? [],
    coordinates,
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
    return () => {};
  }
}



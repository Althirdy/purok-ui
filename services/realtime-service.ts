import { realtimeConfig } from '@/constants/realtime';
import { API_BASE } from '@/lib/axios';
import type { EmergencyReport } from '@/types';
import Pusher from 'pusher-js/react-native';

type CitizenReportPayload = {
  id: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  severity?: EmergencyReport['severity'];
  status?: EmergencyReport['status'];
  timestamp?: string | number;
  reportedBy?: string;
};

type PurokAssignmentPayload = {
  concern: {
    id: number;
    title?: string;
    description?: string;
    category?: string;
    severity?: 'low' | 'medium' | 'high';
    status?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    created_at?: string;
    images?: string[];
    audio?: string | null;
    summary?: string | null;
    transcript?: string | null;
  };
  citizen?: {
    id?: number;
    name?: string;
    phone_number?: string;
  };
  distribution?: {
    id?: number;
    status?: string;
    assigned_at?: string;
  };
};

let pusherClient: Pusher | null = null;
let currentAuthToken: string | null = null;

function getPusherClient(token?: string | null) {
  const normalizedToken = token ?? null;
  if (pusherClient && currentAuthToken === normalizedToken) {
    return pusherClient;
  }
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
  Pusher.logToConsole = __DEV__;
  pusherClient = new Pusher(realtimeConfig.pusherKey, {
    cluster: realtimeConfig.pusherCluster,
    forceTLS: true,
    authEndpoint: realtimeConfig.authEndpoint ?? `${API_BASE}/broadcasting/auth`,
    auth:
      normalizedToken
        ? {
            headers: {
              Authorization: `Bearer ${normalizedToken}`,
              Accept: 'application/json',
            },
          }
        : undefined,
  });
  currentAuthToken = normalizedToken;
  return pusherClient;
}

function normalizeCitizenReport(payload: CitizenReportPayload): EmergencyReport {
  return {
    id: payload.id,
    title: payload.title,
    description: payload.description,
    type: (payload.category as EmergencyReport['type']) ?? 'other',
    location: payload.location ?? 'Unknown location',
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    status: payload.status ?? 'pending',
    severity: payload.severity ?? 'medium',
    source: 'citizen',
    reportedBy: payload.reportedBy,
  };
}

function normalizeAssignment(payload: PurokAssignmentPayload): EmergencyReport {
  const concern = payload.concern ?? ({} as PurokAssignmentPayload['concern']);
  const latitude = concern.latitude != null ? Number(concern.latitude) : null;
  const longitude = concern.longitude != null ? Number(concern.longitude) : null;
  return {
    id: `PUROK-${concern.id}`,
    title: concern.title ?? 'Citizen Concern',
    description: concern.description ?? '',
    type: (concern.category?.toLowerCase() as EmergencyReport['type']) ?? 'other',
    severity: (concern.severity as EmergencyReport['severity']) ?? 'medium',
    status: (concern.status as EmergencyReport['status']) ?? 'pending',
    timestamp: concern.created_at ? new Date(concern.created_at) : new Date(),
    source: 'citizen',
    reportedBy: payload.citizen?.name ?? 'citizen',
    location:
      latitude != null && longitude != null
        ? `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        : 'Citizen submitted location',
  };
}

export function subscribeToPurokAssignments(options: {
  token: string | null;
  userId: string | number | null | undefined;
  onReport: (report: EmergencyReport) => void;
}) {
  if (!options.token || !options.userId) {
    console.warn('[Pusher] Cannot subscribe: missing token or userId', {
      hasToken: !!options.token,
      hasUserId: !!options.userId,
    });
    return () => undefined;
  }
  
  const client = getPusherClient(options.token);
  const channelName = `${realtimeConfig.purokChannelPrefix}${options.userId}`;
  console.log('[Pusher] Subscribing to channel:', channelName);
  
  const channel = client.subscribe(channelName);
  let handlerBound = false;
  
  const handler = (data: PurokAssignmentPayload) => {
    try {
      console.log('[Pusher] 🔔 Event received:', {
        event: realtimeConfig.purokAssignmentEvent,
        channel: channelName,
        concernId: data.concern?.id,
        title: data.concern?.title,
      });
      const normalized = normalizeAssignment(data);
      console.log('[Pusher] ✅ Normalized report:', {
        id: normalized.id,
        title: normalized.title,
      });
      options.onReport(normalized);
    } catch (error) {
      console.error('[Pusher] ❌ Failed to normalize assignment payload', error, data);
    }
  };
  
  const bindHandler = () => {
    if (handlerBound) {
      console.log('[Pusher] Handler already bound, skipping');
      return;
    }
    console.log('[Pusher] Binding handler to event:', realtimeConfig.purokAssignmentEvent);
    channel.bind(realtimeConfig.purokAssignmentEvent, handler);
    handlerBound = true;
    console.log('[Pusher] ✅ Handler bound and ready to receive events');
  };
  
  // Wait for subscription to succeed before binding handler
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('[Pusher] ✅ Successfully subscribed to', channelName);
    bindHandler();
  });
  
  channel.bind('pusher:subscription_error', (err: any) => {
    console.error('[Pusher] ❌ Subscription error:', {
      channel: channelName,
      error: err?.error,
      status: err?.status,
      type: err?.type,
    });
    if (err?.status === 403) {
      console.error('[Pusher] 403 Forbidden - Authorization failed. Check auth token and backend authorization.');
    }
    if (err?.status === 0) {
      console.error('[Pusher] Status 0 - Network/CORS issue. Check auth endpoint accessibility.');
    }
  });
  
  // Check if channel is already subscribed (for instant subscriptions)
  if (channel.subscribed) {
    console.log('[Pusher] Channel already subscribed, binding handler immediately');
    bindHandler();
  }
  
  return () => {
    console.log('[Pusher] Unsubscribing from', channelName);
    channel.unbind(realtimeConfig.purokAssignmentEvent, handler);
    channel.unbind('pusher:subscription_succeeded');
    channel.unbind('pusher:subscription_error');
    client.unsubscribe(channelName);
  };
}

export function subscribeToCitizenReports(onReport: (report: EmergencyReport) => void) {
  const client = getPusherClient();
  const channel = client.subscribe(realtimeConfig.citizenChannel);
  const handler = (data: CitizenReportPayload) => {
    try {
      const normalized = normalizeCitizenReport(data);
      onReport(normalized);
    } catch (error) {
      console.warn('Failed to normalize citizen report payload', error);
    }
  };
  channel.bind(realtimeConfig.citizenReportEvent, handler);
  return () => {
    channel.unbind(realtimeConfig.citizenReportEvent, handler);
    client.unsubscribe(realtimeConfig.citizenChannel);
  };
}

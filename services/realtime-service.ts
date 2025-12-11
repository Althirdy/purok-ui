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
    type: (payload.category?.toLowerCase() as EmergencyReport['type']) ?? 'other',
    location: payload.location ?? 'Citizen submitted location',
    severity: payload.severity ?? 'medium',
    status: payload.status ?? 'pending',
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    source: 'citizen',
    reportedBy: payload.reportedBy ?? 'citizen',
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
    return () => undefined;
  }

  const client = getPusherClient(options.token);
  const channelName = `${realtimeConfig.purokChannelPrefix}${options.userId}`;
  
  // Unsubscribe from existing channel if already subscribed
  try {
    client.unsubscribe(channelName);
  } catch (e) {
    // Ignore if not subscribed
  }
  
  const channel = client.subscribe(channelName);
  
  const handler = (data: PurokAssignmentPayload) => {
    console.log('[Pusher] Received concern.assigned event:', data);
    try {
      const normalized = normalizeAssignment(data);
      console.log('[Pusher] Normalized report:', normalized.id);
      options.onReport(normalized);
    } catch (error) {
      console.warn('[Pusher] Failed to normalize assignment payload', error);
    }
  };

  // Unbind any existing handlers first to prevent duplicates
  channel.unbind(realtimeConfig.purokAssignmentEvent);
  channel.unbind('pusher:subscription_succeeded');
  
  // Bind event handler - Pusher will queue events until subscription succeeds
  channel.bind(realtimeConfig.purokAssignmentEvent, handler);
  
  // Log when subscription succeeds (only bind once)
  const subscriptionHandler = () => {
    console.log('[Pusher] Subscription succeeded for channel:', channelName);
  };
  channel.bind('pusher:subscription_succeeded', subscriptionHandler);

  return () => {
    try {
      channel.unbind(realtimeConfig.purokAssignmentEvent, handler);
      channel.unbind('pusher:subscription_succeeded', subscriptionHandler);
      client.unsubscribe(channelName);
    } catch (error) {
      console.warn('[Pusher] Error during unsubscribe:', error);
    }
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
      console.warn('Failed to normalize citizen report', error);
    }
  };
  channel.bind(realtimeConfig.citizenReportEvent, handler);

  return () => {
    channel.unbind(realtimeConfig.citizenReportEvent, handler);
    client.unsubscribe(realtimeConfig.citizenChannel);
  };
}

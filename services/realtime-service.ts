import Pusher from 'pusher-js/react-native';
import type { EmergencyReport } from '@/types';
import { realtimeConfig } from '@/constants/realtime';

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

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (pusherClient) return pusherClient;
  Pusher.logToConsole = __DEV__;
  pusherClient = new Pusher(realtimeConfig.pusherKey, {
    cluster: realtimeConfig.pusherCluster,
    forceTLS: true,
  });
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

export function subscribeToCitizenReports(
  onReport: (report: EmergencyReport) => void
) {
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



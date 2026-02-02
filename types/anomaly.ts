/**
 * TypeScript Type Definitions for IoT Box / Anomaly Logs
 */

// Anomaly Types
export type AnomalyType = 'sound_anomaly' | 'anti_tampering' | 'crowded';

// Anomaly type labels mapping
export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  sound_anomaly: 'Sound Anomaly',
  anti_tampering: 'Anti-Tampering Alert',
  crowded: 'Crowded Area Detected',
};

// IoT Box information
export interface IoTBox {
  id: number;
  name: string;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: 'online' | 'offline' | 'maintenance';
}

// Single Anomaly Log
export interface AnomalyLog {
  id: number;
  anomaly_type: AnomalyType;
  anomaly_type_label: string;
  iot_box_id: number;
  iot_box?: IoTBox;
  is_confirmed: boolean;
  location?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  description?: string;
  confidence_score?: number;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  confirmed_by?: {
    id: number;
    name: string;
  };
}

// Pagination metadata
export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

// List response structure
export interface AnomalyLogsListResponse {
  success: boolean;
  data: AnomalyLog[];
  meta: PaginationMeta;
}

// Single anomaly response
export interface AnomalyLogResponse {
  success: boolean;
  data: AnomalyLog;
}

// Statistics response structure
export interface AnomalyStatistics {
  total: {
    all_time: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  by_status: {
    pending: number;
    confirmed: number;
  };
  by_type: {
    sound_anomaly: number;
    anti_tampering: number;
    crowded: number;
  };
  today_by_type: {
    sound_anomaly: number;
    anti_tampering: number;
    crowded: number;
  };
  devices: {
    total: number;
    active: number;
    online: number;
  };
  recent_anomalies: AnomalyLog[];
}

export interface AnomalyStatisticsResponse {
  success: boolean;
  data: AnomalyStatistics;
}

// Query parameters for list endpoint
export interface AnomalyLogsQueryParams {
  anomaly_type?: AnomalyType;
  is_confirmed?: boolean;
  iot_box_id?: number;
  per_page?: number;
  page?: number;
}

// Update anomaly payload
export interface UpdateAnomalyPayload {
  is_confirmed: boolean;
}

// Real-time WebSocket event payload
export interface AnomalyCreatedEvent {
  id: number;
  anomaly_type: AnomalyType;
  anomaly_type_label: string;
  iot_box: IoTBox;
  location?: string;
  created_at: string;
}

// Filter state for UI
export interface AnomalyFilter {
  type?: AnomalyType | 'all';
  status?: 'all' | 'pending' | 'confirmed';
  iotBoxId?: number;
}

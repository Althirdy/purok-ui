/**
 * Anomaly Service - API service for IoT Box / Anomaly Logs
 * 
 * Endpoints:
 * - GET /api/v1/anomaly-logs - List anomaly logs for purok (paginated)
 * - GET /api/v1/anomaly-logs/statistics - Dashboard statistics
 * - GET /api/v1/anomaly-logs/{id} - Get single anomaly detail
 * - PUT /api/v1/anomaly-logs/{id} - Confirm/dismiss anomaly
 * - GET /api/v1/map/anomalies - All barangay anomalies for map (no purok filter)
 */

import { httpGet, httpPut } from '@/lib/axios';
import type {
    AnomalyLog,
    AnomalyLogResponse,
    AnomalyLogsListResponse,
    AnomalyLogsQueryParams,
    AnomalyStatistics,
    AnomalyStatisticsResponse,
    UpdateAnomalyPayload,
} from '@/types/anomaly';

const BASE_PATH = '/api/v1/anomaly-logs';
const MAP_BASE_PATH = '/api/v1/map/anomalies';

/**
 * Helper to parse anomaly details and extract embedded media (video/audio)
 * The backend may nest video/audio data inside the details object:
 *   details: { "0": {sensor data}, "video": {public_url, storage_path, ...}, "audio": {...} }
 * We extract these to top-level fields and ensure details is a clean sensor data array.
 */
function parseAnomalyDetails(anomaly: any): AnomalyLog {
  if (!anomaly) return anomaly;
  
  // If details is a string, try to parse it as JSON
  if (typeof anomaly.details === 'string') {
    try {
      anomaly.details = JSON.parse(anomaly.details);
    } catch (e) {
      console.warn('[AnomalyService] Failed to parse details JSON:', e);
      anomaly.details = [];
    }
  }
  
  // Extract video/audio from details before converting to array
  // Backend may put them as: details.video = { public_url, storage_path, mime_type, ... }
  if (anomaly.details && !Array.isArray(anomaly.details) && typeof anomaly.details === 'object') {
    const rawDetails = anomaly.details;
    
    // Extract video if nested in details
    if (rawDetails.video && typeof rawDetails.video === 'object') {
      const vid = rawDetails.video;
      if (!anomaly.video_url) {
        anomaly.video_url = vid.public_url || vid.url || null;
      }
      if (!anomaly.video) {
        anomaly.video = vid.storage_path || vid.path || null;
      }
      console.log('[AnomalyService] Extracted video from details:', anomaly.video_url);
    }
    
    // Extract audio if nested in details
    if (rawDetails.audio && typeof rawDetails.audio === 'object') {
      const aud = rawDetails.audio;
      if (!anomaly.audio_url) {
        anomaly.audio_url = aud.public_url || aud.url || null;
      }
      if (!anomaly.audio) {
        anomaly.audio = aud.storage_path || aud.path || null;
      }
      console.log('[AnomalyService] Extracted audio from details:', anomaly.audio_url);
    }
    
    // Now build sensor data array from numeric keys only
    const sensorEntries = Object.entries(rawDetails)
      .filter(([key]) => !isNaN(Number(key)) || (key !== 'video' && key !== 'audio'))
      .filter(([key]) => key !== 'video' && key !== 'audio')
      .map(([, value]) => value);
    
    anomaly.details = sensorEntries.length > 0 ? sensorEntries : [];
  }
  
  // Ensure details is an array
  if (!Array.isArray(anomaly.details)) {
    anomaly.details = anomaly.details ? [anomaly.details] : [];
  }
  
  // Also parse related anomalies (branching) — they may also have video/audio nested in details
  if (anomaly.related_anomalies && Array.isArray(anomaly.related_anomalies)) {
    anomaly.related_anomalies = anomaly.related_anomalies.map((related: any) => {
      if (!related) return related;
      
      // Parse details string if needed
      if (typeof related.details === 'string') {
        try { related.details = JSON.parse(related.details); } catch { related.details = []; }
      }
      
      // Extract video/audio from related anomaly's details
      if (related.details && !Array.isArray(related.details) && typeof related.details === 'object') {
        const rd = related.details;
        if (rd.video && typeof rd.video === 'object') {
          if (!related.video_url) related.video_url = rd.video.public_url || rd.video.url || null;
          if (!related.video) related.video = rd.video.storage_path || rd.video.path || null;
          console.log('[AnomalyService] Extracted video from related anomaly #' + related.id);
        }
        if (rd.audio && typeof rd.audio === 'object') {
          if (!related.audio_url) related.audio_url = rd.audio.public_url || rd.audio.url || null;
          if (!related.audio) related.audio = rd.audio.storage_path || rd.audio.path || null;
        }
        // Clean sensor data
        const entries = Object.entries(rd)
          .filter(([key]) => key !== 'video' && key !== 'audio')
          .map(([, value]) => value);
        related.details = entries.length > 0 ? entries : [];
      }
      if (!Array.isArray(related.details)) {
        related.details = related.details ? [related.details] : [];
      }
      return related;
    });
  }
  
  return anomaly;
}

/**
 * Build query string from params object
 */
function buildQueryString(params: AnomalyLogsQueryParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.anomaly_type) {
    searchParams.append('anomaly_type', params.anomaly_type);
  }
  if (params.is_confirmed !== undefined) {
    searchParams.append('is_confirmed', String(params.is_confirmed));
  }
  if (params.iot_box_id) {
    searchParams.append('iot_box_id', String(params.iot_box_id));
  }
  if (params.per_page) {
    searchParams.append('per_page', String(params.per_page));
  }
  if (params.page) {
    searchParams.append('page', String(params.page));
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch anomaly logs list (paginated)
 * @param token - Auth token
 * @param params - Query parameters for filtering
 */
export async function fetchAnomalyLogs(
  token: string,
  params: AnomalyLogsQueryParams = {}
): Promise<AnomalyLogsListResponse> {
  const queryString = buildQueryString(params);
  const response = await httpGet<any>(
    `${BASE_PATH}${queryString}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  // Debug: Log raw response structure
  console.log('[AnomalyService] Raw response:', JSON.stringify(response, null, 2).substring(0, 500));
  
  // Handle different response structures
  // Expected: { success: true, data: [...], meta: {...} }
  // Possible: { success: true, data: { data: [...], ... }, meta: {...} }
  // Or Laravel paginated: { data: [...], current_page: ..., ... }
  
  let anomalies: AnomalyLog[] = [];
  let meta: any = null;
  
  if (Array.isArray(response.data)) {
    // Direct array: { data: [...] }
    anomalies = response.data;
    meta = response.meta;
  } else if (response.data?.anomaly_logs?.data && Array.isArray(response.data.anomaly_logs.data)) {
    // Deeply nested: { data: { anomaly_logs: { data: [...], ... } } }
    const pagination = response.data.anomaly_logs;
    anomalies = pagination.data;
    meta = {
      current_page: pagination.current_page,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    };
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    // Nested: { data: { data: [...], ... } }
    anomalies = response.data.data;
    meta = response.data.meta || response.meta || {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    };
  } else if (Array.isArray(response)) {
    // Direct array response
    anomalies = response;
  }
  
  console.log('[AnomalyService] Parsed anomalies count:', anomalies.length);
  
  // Parse each anomaly to extract embedded video/audio from details
  const parsed = anomalies.map(parseAnomalyDetails);

  return {
    success: response.success ?? true,
    data: parsed,
    meta: meta || {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 15,
      to: anomalies.length,
      total: anomalies.length,
    },
  };
}

/**
 * Fetch ALL anomalies for the barangay map (no purok filtering)
 * Uses the new /api/v1/map/anomalies endpoint
 * @param token - Auth token
 * @param params - Query parameters (anomaly_type, is_confirmed, hours, per_page, page)
 */
export async function fetchMapAnomalies(
  token: string,
  params: AnomalyLogsQueryParams & { hours?: number } = {}
): Promise<AnomalyLogsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.anomaly_type) searchParams.append('anomaly_type', params.anomaly_type);
  if (params.is_confirmed !== undefined) searchParams.append('is_confirmed', String(params.is_confirmed));
  if (params.hours) searchParams.append('hours', String(params.hours));
  if (params.per_page) searchParams.append('per_page', String(params.per_page));
  if (params.page) searchParams.append('page', String(params.page));

  const queryString = searchParams.toString();
  const url = `${MAP_BASE_PATH}${queryString ? `?${queryString}` : ''}`;

  console.log('[AnomalyService] Fetching MAP anomalies:', url);

  const response = await httpGet<any>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Same parsing logic as fetchAnomalyLogs
  let anomalies: AnomalyLog[] = [];
  let meta: any = null;

  if (Array.isArray(response.data)) {
    anomalies = response.data;
    meta = response.meta;
  } else if (response.data?.anomaly_logs?.data && Array.isArray(response.data.anomaly_logs.data)) {
    const pagination = response.data.anomaly_logs;
    anomalies = pagination.data;
    meta = {
      current_page: pagination.current_page,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    };
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    anomalies = response.data.data;
    meta = response.data.meta || response.meta || {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    };
  } else if (Array.isArray(response)) {
    anomalies = response;
  }

  console.log('[AnomalyService] Map anomalies count:', anomalies.length);

  // Parse each anomaly to extract embedded video/audio from details
  const parsed = anomalies.map(parseAnomalyDetails);

  return {
    success: response.success ?? true,
    data: parsed,
    meta: meta || {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 100,
      to: anomalies.length,
      total: anomalies.length,
    },
  };
}

/**
 * Fetch anomaly statistics for dashboard
 * @param token - Auth token
 */
export async function fetchAnomalyStatistics(
  token: string
): Promise<AnomalyStatistics> {
  const response = await httpGet<AnomalyStatisticsResponse>(
    `${BASE_PATH}/statistics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Fetch single anomaly detail by ID
 * @param token - Auth token
 * @param id - Anomaly log ID
 */
export async function fetchAnomalyById(
  token: string,
  id: number
): Promise<AnomalyLog | null> {
  const response = await httpGet<any>(
    `${BASE_PATH}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  console.log('[AnomalyService] Full raw response:', JSON.stringify(response, null, 2));
  
  let anomaly: any = null;
  
  // Handle different response structures
  // Try: { data: { anomaly_log: {...} } }
  if (response?.data?.anomaly_log) {
    console.log('[AnomalyService] Found in response.data.anomaly_log');
    anomaly = response.data.anomaly_log;
  }
  // Try: { anomaly_log: {...} }
  else if (response?.anomaly_log) {
    console.log('[AnomalyService] Found in response.anomaly_log');
    anomaly = response.anomaly_log;
  }
  // Try: { data: {...} } with id (direct anomaly object)
  else if (response?.data && response.data.id) {
    console.log('[AnomalyService] Found in response.data (direct)');
    anomaly = response.data;
  }
  // Try: {...} direct response with id
  else if (response?.id) {
    console.log('[AnomalyService] Found in response (direct)');
    anomaly = response;
  }
  
  if (anomaly) {
    return parseAnomalyDetails(anomaly);
  }
  console.log('[AnomalyService] Could not find anomaly in response');
  return null;
}

/**
 * Update anomaly status (confirm or dismiss)
 * @param token - Auth token
 * @param id - Anomaly log ID
 * @param isConfirmed - Whether to confirm (true) or dismiss (false)
 */
export async function updateAnomalyStatus(
  token: string,
  id: number,
  isConfirmed: boolean
): Promise<AnomalyLog> {
  const payload: UpdateAnomalyPayload = { is_confirmed: isConfirmed };
  const response = await httpPut<AnomalyLogResponse>(
    `${BASE_PATH}/${id}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Confirm an anomaly
 * @param token - Auth token
 * @param id - Anomaly log ID
 */
export async function confirmAnomaly(
  token: string,
  id: number
): Promise<AnomalyLog> {
  return updateAnomalyStatus(token, id, true);
}

/**
 * Dismiss an anomaly
 * @param token - Auth token
 * @param id - Anomaly log ID
 */
export async function dismissAnomaly(
  token: string,
  id: number
): Promise<AnomalyLog> {
  return updateAnomalyStatus(token, id, false);
}

/**
 * Fetch pending anomalies (not yet confirmed)
 * @param token - Auth token
 * @param perPage - Items per page (default 15)
 */
export async function fetchPendingAnomalies(
  token: string,
  perPage: number = 15
): Promise<AnomalyLogsListResponse> {
  return fetchAnomalyLogs(token, {
    is_confirmed: false,
    per_page: perPage,
  });
}

/**
 * Fetch anomalies by type
 * @param token - Auth token
 * @param type - Anomaly type filter
 * @param perPage - Items per page (default 15)
 */
export async function fetchAnomaliesByType(
  token: string,
  type: 'sound_anomaly' | 'anti_tampering',
  perPage: number = 15
): Promise<AnomalyLogsListResponse> {
  return fetchAnomalyLogs(token, {
    anomaly_type: type,
    per_page: perPage,
  });
}

/**
 * Fetch anomalies for a specific IoT box
 * @param token - Auth token
 * @param iotBoxId - IoT box ID
 * @param perPage - Items per page (default 15)
 */
export async function fetchAnomaliesByIoTBox(
  token: string,
  iotBoxId: number,
  perPage: number = 15
): Promise<AnomalyLogsListResponse> {
  return fetchAnomalyLogs(token, {
    iot_box_id: iotBoxId,
    per_page: perPage,
  });
}

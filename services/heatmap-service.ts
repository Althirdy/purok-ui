/**
 * Heatmap Service
 * 
 * Fetches verified incident data for heatmap display.
 * Endpoint: GET /api/v1/incidents/heatmap
 * 
 * PRIVACY PROTECTED:
 * - Only returns verified/resolved incidents
 * - NO images or personal details
 * - Only: lat, lng, severity, type, title, occurred_at
 */

import { httpGet } from '@/lib/axios';

/**
 * Raw incident from backend API
 */
export interface HeatmapIncident {
  id: number;
  lat: number;
  lng: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string; // fire, accident, crime, medical, suspicious
  title: string;
  occurred_at: string; // ISO date string
}

/**
 * Normalized heatmap point for map display
 */
export interface HeatmapPoint {
  id: number;
  latitude: number;
  longitude: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  occurredAt: Date;
}

/**
 * Backend API response format
 */
export interface HeatmapResponse {
  success: boolean;
  message: string;
  data: {
    incidents: HeatmapIncident[];
    total: number;
  };
}

/**
 * Filter options for heatmap API
 */
export interface HeatmapFilters {
  accidentType?: string;  // Filter by type (fire, accident, etc.)
  severity?: 'critical' | 'high' | 'medium' | 'low';
  fromDate?: string;      // ISO date string
  toDate?: string;        // ISO date string
}

/**
 * Fetch heatmap data (verified incidents only)
 * 
 * @param options - Optional filters
 * @returns Array of normalized heatmap points
 */
export async function fetchHeatmapData(options?: HeatmapFilters): Promise<HeatmapPoint[]> {
  try {
    const params = new URLSearchParams();
    
    if (options?.accidentType) {
      params.append('accident_type', options.accidentType);
    }
    if (options?.severity) {
      params.append('severity', options.severity);
    }
    if (options?.fromDate) {
      params.append('from_date', options.fromDate);
    }
    if (options?.toDate) {
      params.append('to_date', options.toDate);
    }

    const queryString = params.toString();
    const url = `/api/v1/incidents/heatmap${queryString ? `?${queryString}` : ''}`;
    
    console.log('[HeatmapService] Fetching heatmap data:', url);

    const response = await httpGet<HeatmapResponse>(url);

    if (response.success && response.data?.incidents) {
      const incidents = response.data.incidents;
      console.log('[HeatmapService] ✅ Received', incidents.length, 'verified incidents');
      
      // Normalize the data (convert lat/lng to latitude/longitude)
      return incidents.map((incident): HeatmapPoint => ({
        id: incident.id,
        latitude: incident.lat,
        longitude: incident.lng,
        severity: incident.severity,
        type: incident.type,
        title: incident.title,
        occurredAt: new Date(incident.occurred_at),
      }));
    }
    
    console.warn('[HeatmapService] Invalid response format:', response);
    return [];
  } catch (error) {
    console.error('[HeatmapService] ❌ Error fetching heatmap data:', error);
    return [];
  }
}

/**
 * Convert severity to heatmap weight (for intensity)
 */
export function severityToWeight(severity: HeatmapPoint['severity']): number {
  switch (severity) {
    case 'critical':
      return 1.0;
    case 'high':
      return 0.75;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.25;
    default:
      return 0.5;
  }
}

/**
 * Convert severity to color (for markers/overlay)
 */
export function severityToColor(severity: HeatmapPoint['severity']): string {
  switch (severity) {
    case 'critical':
      return '#DC2626'; // Red
    case 'high':
      return '#F59E0B'; // Orange
    case 'medium':
      return '#3B82F6'; // Blue
    case 'low':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
}



/**
 * Heatmap Service
 * 
 * Fetches verified incident data for heatmap display.
 * This endpoint returns ONLY location and severity (privacy-safe).
 * No personal information, images, or detailed descriptions.
 */

import api from '@/lib/axios';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type?: string; // fire, accident, crime, medical, suspicious
}

export interface HeatmapResponse {
  success: boolean;
  data: HeatmapPoint[];
  message?: string;
}

/**
 * Fetch heatmap data (verified incidents only)
 * 
 * @param options - Optional filters
 * @returns Array of heatmap points with lat/lng/severity
 */
export async function fetchHeatmapData(options?: {
  since?: string; // ISO date string
  type?: string;  // Filter by incident type
}): Promise<HeatmapPoint[]> {
  try {
    const params = new URLSearchParams();
    
    if (options?.since) {
      params.append('since', options.since);
    }
    if (options?.type) {
      params.append('type', options.type);
    }

    const queryString = params.toString();
    const url = `/incidents/heatmap${queryString ? `?${queryString}` : ''}`;
    
    console.log('[HeatmapService] Fetching heatmap data:', url);
    
    const response = await api.get<HeatmapResponse>(url);
    
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('[HeatmapService] Received', response.data.data.length, 'points');
      return response.data.data;
    }
    
    console.warn('[HeatmapService] Invalid response format');
    return [];
  } catch (error) {
    console.error('[HeatmapService] Error fetching heatmap data:', error);
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


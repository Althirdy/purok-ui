/**
 * Active Accidents Service
 * 
 * Fetches ongoing/active accidents from CCTV detection (acknowledged by Operator).
 * Endpoint: GET /api/v1/active-accidents
 * 
 * PRIVACY NOTES (same as citizen concerns):
 * - Photos/media shown only if incident is verified (acknowledged/resolved)
 * - Only shows "In Progress" accidents (acknowledged by Operator)
 * - Full details fetched when clicking on marker
 * - InfoCard handles privacy logic for displaying images
 */

import { httpGet } from '@/lib/axios';
import type { EmergencyReport } from '@/types';

/**
 * Marker data from GET /api/v1/active-accidents (minimal for map)
 */
export interface AccidentMarker {
  id: number;
  latitude: string | number;
  longitude: string | number;
  accident_type: string;
  severity: string;
}

/**
 * Full accident details from GET /api/v1/active-accidents/{id}
 * Note: Media/photos availability depends on role and verification status
 */
export interface ActiveAccident {
  id: number;
  title: string;
  description: string;
  latitude: string | number;
  longitude: string | number;
  status: string;
  severity: string;
  accident_type: string;
  occurred_at: string; // "2 hours ago" format
  location?: {
    location_name?: string;
    barangay?: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
  };
  // Media/images - available for verified incidents (same logic as citizen concerns)
  media?: Array<{
    id: number;
    url: string;
    type?: string;
  }>;
  images?: string[]; // Alternative format - array of URLs
}

interface MarkersResponse {
  success: boolean;
  message: string;
  data: {
    markers: AccidentMarker[];
    meta: {
      total: number;
    };
  };
}

interface AccidentDetailResponse {
  success: boolean;
  message: string;
  data: {
    accident: ActiveAccident;
  };
}

/**
 * Fetch all active (In Progress) accidents for map markers
 * 
 * Returns minimal data for fast map rendering:
 * - id, latitude, longitude, accident_type, severity
 * 
 * @param token - Authentication token (required)
 */
export async function fetchActiveAccidentMarkers(token: string): Promise<AccidentMarker[]> {
  try {
    console.log('[ActiveAccidents] Fetching active accident markers...');
    
    const response = await httpGet<MarkersResponse>('/api/v1/active-accidents', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.success && response.data?.markers) {
      const markers = response.data.markers;
      console.log('[ActiveAccidents] ✅ Received', markers.length, 'active accidents');
      return markers;
    }

    console.warn('[ActiveAccidents] Invalid response format:', response);
    return [];
  } catch (error) {
    console.error('[ActiveAccidents] ❌ Error fetching markers:', error);
    return [];
  }
}

/**
 * Fetch full details of a specific active accident
 * 
 * Note: Media/photos availability depends on verification status (same as citizen concerns)
 * 
 * @param id - Accident ID
 * @param token - Authentication token (required)
 */
export async function fetchActiveAccidentDetail(id: number, token: string): Promise<ActiveAccident | null> {
  try {
    console.log('[ActiveAccidents] Fetching accident details:', id);
    
    const response = await httpGet<AccidentDetailResponse>(`/api/v1/active-accidents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.success && response.data?.accident) {
      console.log('[ActiveAccidents] ✅ Got accident details');
      return response.data.accident;
    }

    console.warn('[ActiveAccidents] Accident not found or invalid response');
    return null;
  } catch (error) {
    console.error('[ActiveAccidents] ❌ Error fetching details:', error);
    return null;
  }
}

/**
 * Convert AccidentMarker to EmergencyReport format for map display
 */
export function markerToEmergencyReport(marker: AccidentMarker): EmergencyReport {
  const lat = typeof marker.latitude === 'string' ? parseFloat(marker.latitude) : marker.latitude;
  const lng = typeof marker.longitude === 'string' ? parseFloat(marker.longitude) : marker.longitude;

  return {
    id: `accident-${marker.id}`,
    type: normalizeAccidentType(marker.accident_type),
    title: formatAccidentTitle(marker.accident_type),
    description: 'CCTV detected incident - click for details',
    location: 'Location pending...',
    timestamp: new Date(),
    status: 'acknowledged', // All active accidents are acknowledged
    severity: normalizeSeverity(marker.severity),
    source: 'cctv',
    coordinates: {
      latitude: lat,
      longitude: lng,
    },
  };
}

/**
 * Convert ActiveAccident (full details) to EmergencyReport
 */
export function accidentToEmergencyReport(accident: ActiveAccident): EmergencyReport {
  const lat = typeof accident.latitude === 'string' ? parseFloat(accident.latitude) : accident.latitude;
  const lng = typeof accident.longitude === 'string' ? parseFloat(accident.longitude) : accident.longitude;

  // Build location string
  let locationStr = 'Unknown location';
  if (accident.location) {
    const parts = [
      accident.location.location_name,
      accident.location.barangay,
      accident.location.landmark,
    ].filter(Boolean);
    if (parts.length > 0) {
      locationStr = parts.join(', ');
    }
  }

  // Extract images from media array or images field (same logic as citizen concerns)
  const images = extractAccidentImages(accident);

  return {
    id: `accident-${accident.id}`,
    type: normalizeAccidentType(accident.accident_type),
    title: accident.title || formatAccidentTitle(accident.accident_type),
    description: accident.description || 'CCTV detected incident',
    location: locationStr,
    timestamp: new Date(), // occurred_at is relative like "2 hours ago"
    status: accident.status === 'In Progress' ? 'acknowledged' : 'resolved',
    severity: normalizeSeverity(accident.severity),
    source: 'cctv',
    coordinates: {
      latitude: lat,
      longitude: lng,
    },
    // Images shown if verified (same privacy logic as citizen concerns)
    images: images.length > 0 ? images : undefined,
  };
}

/**
 * Extract images from accident details
 * Handles both media array and images array formats
 */
function extractAccidentImages(accident: ActiveAccident): string[] {
  const images: string[] = [];

  // Extract from media array (if available)
  if (accident.media && Array.isArray(accident.media)) {
    for (const item of accident.media) {
      if (item.url) {
        images.push(item.url);
      }
    }
  }

  // Extract from images array (alternative format)
  if (accident.images && Array.isArray(accident.images)) {
    for (const url of accident.images) {
      if (url && !images.includes(url)) {
        images.push(url);
      }
    }
  }

  return images;
}

/**
 * Normalize accident type to EmergencyReport type
 */
function normalizeAccidentType(type: string): EmergencyReport['type'] {
  const lowerType = (type || '').toLowerCase();
  
  if (lowerType.includes('fire') || lowerType.includes('flame')) {
    return 'fire';
  }
  if (lowerType.includes('accident') || lowerType.includes('crash') || lowerType.includes('collision')) {
    return 'accident';
  }
  if (lowerType.includes('crime') || lowerType.includes('theft') || lowerType.includes('robbery')) {
    return 'crime';
  }
  if (lowerType.includes('medical') || lowerType.includes('injury') || lowerType.includes('health')) {
    return 'medical';
  }
  if (lowerType.includes('suspicious') || lowerType.includes('alert')) {
    return 'suspicious';
  }
  
  return 'other';
}

/**
 * Normalize severity
 */
function normalizeSeverity(severity: string): EmergencyReport['severity'] {
  const lowerSeverity = (severity || '').toLowerCase();
  
  if (lowerSeverity === 'critical' || lowerSeverity === 'extreme') {
    return 'critical';
  }
  if (lowerSeverity === 'high' || lowerSeverity === 'severe') {
    return 'high';
  }
  if (lowerSeverity === 'medium' || lowerSeverity === 'moderate') {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Format accident type to readable title
 */
function formatAccidentTitle(type: string): string {
  if (!type) return 'Detected Incident';
  
  // Capitalize first letter of each word
  return type
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


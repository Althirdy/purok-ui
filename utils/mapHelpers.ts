/**
 * Map Helper Functions
 */

import type { Ionicons } from '@expo/vector-icons';
import type { EmergencyReport } from '@/types';
import { getSeverityColor } from '@/utils/reportHelpers';

/**
 * Get marker icon based on report type
 */
export const getMarkerIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'fire':
      return 'flame';
    case 'medical':
      return 'medical';
    case 'crime':
      return 'shield';
    case 'accident':
      return 'car';
    case 'suspicious':
      return 'warning';
    default:
      return 'location';
  }
};

/**
 * Get marker color based on report type and severity
 */
export const getMarkerColor = (
  type: EmergencyReport['type'],
  severity: EmergencyReport['severity']
): string => {
  switch (type) {
    case 'fire':
      return severity === 'critical' ? '#DC2626' : severity === 'high' ? '#EF4444' : '#F59E0B';
    case 'medical':
      return severity === 'critical' ? '#DC2626' : severity === 'high' ? '#EF4444' : '#3B82F6';
    case 'crime':
      return severity === 'critical' ? '#991B1B' : severity === 'high' ? '#DC2626' : '#7C2D12';
    case 'accident':
      return severity === 'critical' ? '#DC2626' : severity === 'high' ? '#F59E0B' : '#FBBF24';
    case 'suspicious':
      return severity === 'critical' ? '#7C3AED' : severity === 'high' ? '#8B5CF6' : '#A78BFA';
    default:
      return getSeverityColor(severity);
  }
};

/**
 * Process markers to jitter overlapping coordinates
 */
export function processMarkersWithJitter<T extends { id: string; latitude: number; longitude: number }>(
  markers: T[]
): (T & { _lat: number; _lng: number })[] {
  if (!markers.length) return [];

  const keyFor = (lat: number, lng: number) => `${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const groups = new Map<string, T[]>();

  for (const m of markers) {
    const k = keyFor(m.latitude, m.longitude);
    const arr = groups.get(k) || [];
    arr.push(m);
    groups.set(k, arr);
  }

  const result: (T & { _lat: number; _lng: number })[] = [];
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  groups.forEach((group) => {
    const baseLat = group[0].latitude;
    const baseLng = group[0].longitude;
    const cosLat = Math.cos((baseLat * Math.PI) / 180);
    const metersPerDegLat = 111_320;
    const metersPerDegLng = 111_320 * cosLat;

    group.forEach((m, idx) => {
      if (group.length === 1) {
        result.push({ ...m, _lat: baseLat, _lng: baseLng });
        return;
      }
      const radiusMeters = 4 * Math.sqrt(idx);
      const angle = idx * GOLDEN_ANGLE;
      const dx = (radiusMeters * Math.cos(angle)) / metersPerDegLng;
      const dy = (radiusMeters * Math.sin(angle)) / metersPerDegLat;
      result.push({ ...m, _lat: baseLat + dy, _lng: baseLng + dx });
    });
  });

  return result;
}

/**
 * Selected marker type
 */
export type SelectedMarker = {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  location: string;
  color: string;
} | null;



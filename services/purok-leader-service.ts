/**
 * Purok Leader Service - API integration for purok leader endpoints
 */

import { httpGet, httpPut } from '@/lib/axios';
import type { EmergencyReport } from '@/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';

// API Response Types
interface PurokLeaderConcern {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'ongoing' | 'escalated' | 'resolved';
  created_at: string;
  updated_at?: string;
  images?: string[];
  audio?: string | null;
  summary?: string | null;
  transcript?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distribution_id?: number;
  distribution_status?: string;
}

interface PurokLeaderConcernApiResponse {
  data: PurokLeaderConcern[];
  message?: string;
}

// Status mapping from API to app format
const statusMap: Record<string, EmergencyReport['status']> = {
  pending: 'pending',
  ongoing: 'acknowledged',
  escalated: 'acknowledged',
  resolved: 'resolved',
};

// Category mapping from API to app format
const categoryMap: Record<string, EmergencyReport['type']> = {
  accident: 'accident',
  crime: 'crime',
  fire: 'fire',
  medical: 'medical',
  suspicious: 'suspicious',
  voice_concern: 'other',
  other: 'other',
};

/**
 * Normalize API response to EmergencyReport format
 */
function normalizePurokLeaderConcern(apiConcern: PurokLeaderConcern): EmergencyReport {
  const coordinates = apiConcern.latitude && apiConcern.longitude
    ? {
        latitude: typeof apiConcern.latitude === 'string' 
          ? parseFloat(apiConcern.latitude) 
          : apiConcern.latitude,
        longitude: typeof apiConcern.longitude === 'string' 
          ? parseFloat(apiConcern.longitude) 
          : apiConcern.longitude,
      }
    : undefined;

  const location = coordinates
    ? `Lat ${coordinates.latitude.toFixed(4)}, Lng ${coordinates.longitude.toFixed(4)}`
    : 'Location not available';

  return {
    id: `PUROK-${apiConcern.id}`,
    title: apiConcern.title,
    description: apiConcern.description || apiConcern.summary || 'No description provided',
    type: categoryMap[apiConcern.category] || 'other',
    location,
    timestamp: new Date(apiConcern.created_at),
    status: statusMap[apiConcern.status] || 'pending',
    severity: apiConcern.severity || 'low',
    source: 'citizen',
    images: apiConcern.images || [],
    coordinates,
  };
}

/**
 * Fetch all assigned concerns for the authenticated purok leader
 */
export async function fetchPurokLeaderConcerns(authToken: string): Promise<EmergencyReport[]> {
  try {
    const response = await httpGet<PurokLeaderConcernApiResponse>(
      '/api/v1/purok-leader/concerns',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    const concerns = Array.isArray(response.data) ? response.data : [];
    return concerns.map(normalizePurokLeaderConcern);
  } catch (error) {
    console.error('[PurokLeaderService] Error fetching concerns:', error);
    return [];
  }
}

/**
 * Fetch a specific concern by ID
 */
export async function fetchPurokLeaderConcernById(
  id: string,
  authToken: string
): Promise<EmergencyReport | null> {
  try {
    // Extract numeric ID from format "PUROK-{id}"
    const numericId = id.replace('PUROK-', '');
    const response = await httpGet<{ data: PurokLeaderConcern }>(
      `/api/v1/purok-leader/concerns/${numericId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    return normalizePurokLeaderConcern(response.data);
  } catch (error) {
    console.error('[PurokLeaderService] Error fetching concern:', error);
    return null;
  }
}

/**
 * Update concern status
 */
export async function updateConcernStatusAPI(
  id: string,
  status: 'pending' | 'acknowledged' | 'resolved',
  authToken: string
): Promise<boolean> {
  try {
    // Extract numeric ID from format "PUROK-{id}"
    const numericId = id.replace('PUROK-', '');
    
    // Map app status to API status
    const apiStatus = status === 'acknowledged' ? 'ongoing' : status;
    
    await httpPut(
      `/api/v1/purok-leader/concerns/${numericId}/status`,
      { status: apiStatus },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    return true;
  } catch (error) {
    console.error('[PurokLeaderService] Error updating concern status:', error);
    return false;
  }
}

import type { EmergencyReport } from '@/types';
import { httpGet, httpPut } from '@/lib/axios';

interface AssignedConcernsResponse {
  success: boolean;
  data: {
    concerns: AssignedConcern[];
  };
}

export interface AssignedConcern {
  id: number;
  distribution_id?: number;
  title: string;
  description: string;
  category: string;
  severity?: 'low' | 'medium' | 'high';
  status?: string; // Concern-level status
  distribution_status?: string; // Distribution-level status
  latitude?: string | number | null;
  longitude?: string | number | null;
  created_at: string;
  updated_at?: string;
  images?: string[];
  audio?: string | null;
  summary?: string | null;
  transcript?: string | null;
  citizen?: {
    id?: number;
    name?: string;
    phone_number?: string;
  };
  distribution?: {
    id?: number;
    status?: string; // Status from distribution object
    assigned_at?: string;
  };
}

export async function fetchAssignedConcerns(token: string): Promise<EmergencyReport[]> {
  const response = await httpGet<AssignedConcernsResponse>('/api/v1/purok-leader/concerns', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const concerns = response?.data?.concerns ?? [];
  
  // Log raw status data for debugging
  if (concerns.length > 0) {
    const statusDebug = concerns.slice(0, 3).map(c => ({
      id: c.id,
      concern_status: c.status,
      distribution_status: c.distribution_status,
      distribution_status_nested: c.distribution?.status,
    }));
    console.log('[PurokLeaderService] Sample raw status data:', statusDebug);
  }
  
  const normalized = concerns.map(normalizeAssignedConcern);
  
  // Log summary instead of full array
  if (concerns.length > 0) {
    const statusCounts = normalized.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`[PurokLeaderService] Fetched ${concerns.length} concerns:`, statusCounts);
  }
  
  return normalized;
}

interface ConcernDetailResponse {
  success: boolean;
  data: {
    concern: AssignedConcern;
  };
}

export async function fetchAssignedConcernDetail(token: string, id: number | string): Promise<EmergencyReport> {
  console.log(`[PurokLeaderService] Fetching concern detail for ID: ${id}`);
  const response = await httpGet<ConcernDetailResponse>(`/api/v1/purok-leader/concerns/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  const concern = response?.data?.concern;
  const normalized = normalizeAssignedConcern(concern);
  console.log(`[PurokLeaderService] Fetched concern ${id}: ${normalized.status}`);
  
  return normalized;
}

interface UpdateStatusRequest {
  status: 'pending' | 'ongoing' | 'escalated' | 'resolved';
  remarks?: string; // Optional remarks/notes about the status update
}

interface UpdateStatusResponse {
  success: boolean;
  data: {
    concern_id: string | number;
    new_status: string;
  };
}

export async function updateAssignedConcernStatus(
  token: string,
  id: number | string,
  status: UpdateStatusRequest['status'],
  remarks?: string,
): Promise<UpdateStatusResponse> {
  try {
    // Validate status value (must be one of the allowed values)
    const allowedStatuses: Array<UpdateStatusRequest['status']> = ['pending', 'ongoing', 'escalated', 'resolved'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${allowedStatuses.join(', ')}`);
    }
    
    // Generate default remarks based on status if not provided
    const defaultRemarks: Record<string, string> = {
      'ongoing': 'The concern is ongoing',
      'resolved': 'The concern has been resolved',
      'escalated': 'The concern has been escalated',
      'pending': 'The concern is pending',
    };
    
    const requestBody: UpdateStatusRequest = {
      status,
      remarks: remarks || defaultRemarks[status] || `Status updated to ${status}`,
    };
    
    // Validate token format (should be like "43|49p1hlHznzJlbnq0M67IIVH5JGht6ituU3QSYEI97e4e4a12")
    if (!token || token.trim().length === 0) {
      throw new Error('Authentication token is required');
    }
    
    // Check if token has the expected format (contains pipe separator)
    if (!token.includes('|')) {
      console.warn('[PurokLeaderService] Token format may be incorrect - expected format: "id|token"');
    }
    
    const endpoint = `/api/v1/purok-leader/concerns/${id}/status`;
    const fullUrl = `https://www.urbanwatch.me${endpoint}`;
    
    // Ensure token doesn't already have "Bearer " prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 [PurokLeaderService] SENDING STATUS UPDATE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Endpoint:', fullUrl);
    console.log('🔑 Method: PUT');
    console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('🔐 Token Info:', {
      tokenLength: cleanToken.length,
      tokenFormat: cleanToken.includes('|') ? 'valid (has pipe)' : 'invalid (no pipe)',
      tokenPrefix: cleanToken.substring(0, 20) + '...',
    });
    console.log('🔐 Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${cleanToken.substring(0, 20)}...` // Show only first 20 chars for security
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const response = await httpPut<UpdateStatusResponse>(
      endpoint,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      },
    );
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 [PurokLeaderService] STATUS UPDATE RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Status Code: 200 OK');
    console.log('📦 Response Body:', JSON.stringify(response, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return response;
  } catch (error: any) {
    console.error('[PurokLeaderService] Error updating concern status:', {
      id,
      status,
      error: error?.message || error,
    });
    throw error;
  }
}

export function normalizeAssignedConcern(concern: AssignedConcern): EmergencyReport {
  const latitude = concern.latitude != null ? Number(concern.latitude) : null;
  const longitude = concern.longitude != null ? Number(concern.longitude) : null;
  
  // Map backend status to frontend status (same mapping as in realtime-service.ts)
  // Backend uses: 'pending' | 'ongoing' | 'escalated' | 'resolved'
  // Frontend uses: 'pending' | 'acknowledged' | 'resolved'
  const statusMap: Record<string, EmergencyReport['status']> = {
    'pending': 'pending',
    'ongoing': 'acknowledged',
    'escalated': 'acknowledged',
    'resolved': 'resolved',
  };
  
  // Map backend category to frontend type (same mapping as in realtime-service.ts)
  // Citizen categories: 'safety', 'security', 'infrastructure', 'environment', 'noise', 'other', 'voice_concern'
  // Frontend types: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other'
  const categoryMap: Record<string, EmergencyReport['type']> = {
    'safety': 'suspicious',      // Safety concerns -> Suspicious Activity
    'security': 'crime',          // Security -> Crime
    'infrastructure': 'other',    // Infrastructure -> Other
    'environment': 'other',       // Environment -> Other
    'noise': 'other',             // Noise -> Other
    'other': 'other',             // Other -> Other
    'voice_concern': 'other',     // Voice concern -> Other
  };
  
  // Get status from various sources with priority
  // Backend updates BOTH concern.status AND distribution.status
  // Priority: distribution_status > concern.status > distribution.status
  // Backend mapping: 'ongoing' → distribution.status = 'in_progress', 'resolved' → 'resolved'
  let backendStatus: string = 'pending';
  
  // Priority 1: distribution_status (this is the distribution-level status)
  // Values: 'assigned' (pending), 'in_progress' (ongoing), 'resolved' (resolved)
  if (concern.distribution_status) {
    const distributionStatusMap: Record<string, string> = {
      'assigned': 'pending',
      'in_progress': 'ongoing',
      'resolved': 'resolved',
    };
    const mapped = distributionStatusMap[concern.distribution_status.toLowerCase()];
    if (mapped) {
      backendStatus = mapped;
    }
  }
  // Priority 2: concern.status (this is also updated by backend)
  // If distribution_status is not available or not updated yet, use concern.status
  // This handles cases where backend updates concern.status but distribution_status is stale
  else if (concern.status) {
    backendStatus = concern.status;
  }
  // Priority 3: distribution.status (nested object, last resort)
  else if (concern.distribution?.status) {
    // Map distribution.status values if needed
    const distStatusMap: Record<string, string> = {
      'assigned': 'pending',
      'in_progress': 'ongoing',
      'resolved': 'resolved',
    };
    const mapped = distStatusMap[concern.distribution.status.toLowerCase()];
    backendStatus = mapped || concern.distribution.status;
  }
  
  // If both concern.status and distribution_status exist, prefer the one that's more recent
  // Check if concern.status is "resolved" but distribution_status is not - use concern.status
  if (concern.status === 'resolved' && concern.distribution_status !== 'resolved') {
    backendStatus = 'resolved'; // concern.status is more up-to-date
  }
  
  // Log status resolution for debugging (only for specific IDs to reduce noise)
  if (concern.id === 12 || concern.id === 14) {
    console.log(`[PurokLeaderService] Status resolution for concern ${concern.id}:`, {
      concern_status: concern.status,
      distribution_status: concern.distribution_status,
      distribution_status_nested: concern.distribution?.status,
      resolved_backend_status: backendStatus,
      final_frontend_status: statusMap[backendStatus.toLowerCase()] ?? 'pending',
    });
  }
  
  // Map backend status to frontend status
  const frontendStatus = statusMap[backendStatus.toLowerCase()] ?? 'pending';
  
  // Map category to type
  const category = concern.category?.toLowerCase() || 'other';
  const reportType = categoryMap[category] ?? 'other';
  
  return {
    id: `PUROK-${concern.id}`,
    title: concern.title,
    description: concern.description,
    type: reportType,
    severity: (concern.severity as EmergencyReport['severity']) ?? 'medium',
    status: frontendStatus,
    timestamp: new Date(concern.created_at),
    location:
      latitude != null && longitude != null
        ? `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        : 'Citizen submitted location',
    source: 'citizen',
    reportedBy: concern.citizen?.name ?? 'citizen',
    images: concern.images,
    audio: concern.audio,
    coordinates: latitude != null && longitude != null ? { latitude, longitude } : undefined,
    originalCategory: category, // Preserve original category for display
  };
}

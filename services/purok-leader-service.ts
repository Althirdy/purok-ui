import type { EmergencyReport } from '@/types';
import { httpGet, httpPut } from '@/api/axios';

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
  status?: string;
  distribution_status?: string;
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
}

export async function fetchAssignedConcerns(token: string): Promise<EmergencyReport[]> {
  const response = await httpGet<AssignedConcernsResponse>('/api/v1/purok-leader/concerns', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const concerns = response?.data?.concerns ?? [];
  return concerns.map(normalizeAssignedConcern);
}

interface ConcernDetailResponse {
  success: boolean;
  data: {
    concern: AssignedConcern;
  };
}

export async function fetchAssignedConcernDetail(token: string, id: number | string): Promise<EmergencyReport> {
  const response = await httpGet<ConcernDetailResponse>(`/api/v1/purok-leader/concerns/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return normalizeAssignedConcern(response?.data?.concern);
}

interface UpdateStatusRequest {
  status: 'pending' | 'ongoing' | 'escalated' | 'resolved';
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
): Promise<UpdateStatusResponse> {
  return httpPut<UpdateStatusResponse>(
    `/api/v1/purok-leader/concerns/${id}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function normalizeAssignedConcern(concern: AssignedConcern): EmergencyReport {
  const latitude = concern.latitude != null ? Number(concern.latitude) : null;
  const longitude = concern.longitude != null ? Number(concern.longitude) : null;

  return {
    id: `PUROK-${concern.id}`,
    title: concern.title,
    description: concern.description,
    type: (concern.category?.toLowerCase() as EmergencyReport['type']) ?? 'other',
    severity: (concern.severity as EmergencyReport['severity']) ?? 'medium',
    status: (concern.status as EmergencyReport['status']) ?? 'pending',
    timestamp: new Date(concern.created_at),
    location:
      latitude != null && longitude != null
        ? `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        : 'Citizen submitted location',
    source: 'citizen',
    reportedBy: concern.citizen?.name ?? 'citizen',
  };
}


import type { EmergencyReport } from '@/types';
import { httpGet } from '@/api/axios';

interface CitizenConcernApiResponse {
  success: boolean;
  data: {
    concerns: CitizenConcern[];
  };
}

interface CitizenConcern {
  id: number;
  title: string;
  description: string;
  category: string;
  severity?: 'low' | 'medium' | 'high';
  latitude?: string | number | null;
  longitude?: string | number | null;
  status?: string;
  created_at: string;
  images?: string[];
}

function normalizeCitizenConcern(concern: CitizenConcern): EmergencyReport {
  return {
    id: `CITIZEN-${concern.id}`,
    title: concern.title,
    description: concern.description,
    type: (concern.category?.toLowerCase() as EmergencyReport['type']) ?? 'other',
    severity: (concern.severity as EmergencyReport['severity']) ?? 'medium',
    status: (concern.status as EmergencyReport['status']) ?? 'pending',
    timestamp: new Date(concern.created_at),
    source: 'citizen',
    location: concern.latitude && concern.longitude
      ? `Lat ${Number(concern.latitude).toFixed(4)}, Lng ${Number(concern.longitude).toFixed(4)}`
      : 'Citizen submitted location',
  };
}

export async function fetchCitizenConcerns(): Promise<EmergencyReport[]> {
  const response = await httpGet<CitizenConcernApiResponse>('/api/v1/concerns');
  const concerns = response?.data?.concerns ?? [];
  return concerns.map(normalizeCitizenConcern);
}


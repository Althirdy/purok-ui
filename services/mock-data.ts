/**
 * Mock Data Service
 * Provides sample data for development and testing
 */

import type { EmergencyReport, User } from '@/types';

export const mockUser: User = {
  id: 'user-001',
  name: 'Juan Dela Cruz',
  role: 'purok_leader',
  purokId: 'purok-001',
  purokName: 'Purok 1 - Argus',
  pin: '1234',
};

export const mockReports: EmergencyReport[] = [
  {
    id: 'report-001',
    type: 'accident',
    title: 'Car collision detected',
    description: "There's a multi-car collision near Holiday Island",
    location: 'Barangay 179, New Manindotes',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    status: 'pending',
    severity: 'high',
    source: 'cctv',
  },
  {
    id: 'report-002',
    type: 'suspicious',
    title: 'Suspicious Activity',
    description: "There's a person suddenly collapsed.",
    location: 'Barangay 179, New Manindotes',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'acknowledged',
    severity: 'medium',
    source: 'sensor_box',
  },
  {
    id: 'report-003',
    type: 'fire',
    title: 'Smoke detected in residential area',
    description: 'Sensor detected unusual smoke levels in residential zone.',
    location: 'Barangay 180, San Isidro',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    status: 'resolved',
    severity: 'critical',
    source: 'sensor_box',
  },
  {
    id: 'report-004',
    type: 'crime',
    title: 'Potential break-in detected',
    description: 'Motion detected at closed establishment during off-hours.',
    location: 'Barangay 181, Commerce Street',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    status: 'acknowledged',
    severity: 'high',
    source: 'cctv',
  },
  {
    id: 'report-005',
    type: 'medical',
    title: 'Medical emergency reported',
    description: 'Citizen reported elderly person needing immediate assistance.',
    location: 'Barangay 179, New Manindotes',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    status: 'resolved',
    severity: 'critical',
    source: 'citizen_reports',
  },
  {
    id: 'report-006',
    type: 'other',
    title: 'Noise complaint',
    description: 'Multiple reports of loud noise disturbance.',
    location: 'Barangay 182, Residential Area',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: 'pending',
    severity: 'low',
    source: 'citizen_reports',
  },
];

export function getReportsBySource(source: string): EmergencyReport[] {
  if (source === 'all') return mockReports;
  return mockReports.filter(report => report.source === source);
}

export function authenticateUser(pin: string): User | null {
  if (pin === mockUser.pin) {
    return mockUser;
  }
  return null;
}


/**
 * Report Helper Functions
 * Utility functions for formatting and processing report data
 */

import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';

const { colors } = DesignSystem;

/**
 * Format timestamp to relative time (e.g., "15m ago", "1h ago")
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const reportDate = new Date(date);
  const diff = now.getTime() - reportDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  
  // Format date: MM/DD/YYYY
  const month = reportDate.getMonth() + 1;
  const day = reportDate.getDate();
  const year = reportDate.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format timestamp to locale string (for detailed views)
 */
export function formatTimestampDetailed(date?: Date): string {
  if (!date) return '';
  try {
    return date.toLocaleString();
  } catch {
    return '';
  }
}

/**
 * Get category display name from report type
 */
export function getCategory(type: EmergencyReport['type']): string {
  switch (type) {
    case 'accident':
      return 'Road Accident';
    case 'crime':
      return 'Crime';
    case 'fire':
      return 'Fire';
    case 'medical':
      return 'Medical Emergency';
    case 'suspicious':
      return 'Suspicious Activity';
    case 'other':
      return 'Flood';
    default:
      return 'Other';
  }
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: EmergencyReport['severity']): string {
  switch (severity) {
    case 'critical':
      return colors.semantic.error;
    case 'high':
      return colors.accent.orange;
    case 'medium':
      return colors.accent.orange;
    case 'low':
      return colors.primary.blue;
    default:
      return colors.accent.orange;
  }
}

/**
 * Get status badge color and border
 */
export function getStatusColor(status: EmergencyReport['status']): {
  backgroundColor: string;
  borderColor: string;
} {
  if (status === 'pending') {
    return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
  }
  if (status === 'acknowledged') {
    return { backgroundColor: colors.semantic.success + '20', borderColor: colors.semantic.success };
  }
  if (status === 'resolved') {
    return { backgroundColor: colors.semantic.success + '20', borderColor: colors.semantic.success };
  }
  return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
}

/**
 * Get status display text
 */
export function getStatusText(status: EmergencyReport['status']): string {
  if (status === 'pending') return 'Pending';
  if (status === 'acknowledged') return 'Acknowledged';
  if (status === 'resolved') return 'Resolved ✓';
  return 'Pending';
}

/**
 * Format report ID for display (shortened version)
 */
export function formatReportId(id: string): string {
  // Format: CN-YYYYMMDD-XXXXX or SENSOR-XXXXX
  if (id.startsWith('SENSOR-')) {
    return id.split('-').slice(0, 3).join('-');
  }
  if (id.includes('-')) {
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
  }
  return id.substring(0, 15);
}



/**
 * Report Service - Handles report generation and management
 */

import type { EmergencyReport } from '@/types';
import { anomalyToReport as sensorDataToReport, type SensorData } from './firebase-service';

/**
 * Generate a comprehensive report from sensor data
 */
export function generateReport(sensorData: SensorData): EmergencyReport {
  return sensorDataToReport(sensorData);
}

/**
 * Format report data for display
 */
export function formatReportForDisplay(report: EmergencyReport): {
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  location: string;
} {
  return {
    title: report.title,
    description: report.description,
    severity: report.severity.toUpperCase(),
    timestamp: report.timestamp.toLocaleString(),
    location: report.location,
  };
}

/**
 * Generate report summary statistics
 */
export function generateReportSummary(reports: EmergencyReport[]): {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
} {
  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    acknowledged: reports.filter(r => r.status === 'acknowledged').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    bySeverity: reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byType: reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}


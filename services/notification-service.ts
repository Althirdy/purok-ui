/**
 * Notification Service - Handles in-app notifications for sensor alerts
 */

import { Alert } from 'react-native';
import type { EmergencyReport } from '@/types';

export interface Notification {
  id: string;
  type: 'sensor_alert' | 'report_update' | 'system';
  title: string;
  message: string;
  report?: EmergencyReport;
  timestamp: Date;
  read: boolean;
}

/**
 * Show alert notification for critical/high severity reports
 */
export function showSensorAlert(report: EmergencyReport, onView?: () => void): void {
  const severityEmoji = report.severity === 'critical' ? '🚨' : '⚠️';
  
  Alert.alert(
    `${severityEmoji} New Sensor Alert`,
    `${report.title}\n\n${report.description}\n\nLocation: ${report.location}`,
    [
      ...(onView ? [{ text: 'View', onPress: onView }] : []),
      { text: 'OK', style: 'cancel' },
    ],
    { cancelable: true }
  );
}

/**
 * Create notification object from report
 */
export function createNotificationFromReport(report: EmergencyReport): Notification {
  return {
    id: `notif-${report.id}`,
    type: 'sensor_alert',
    title: report.title,
    message: report.description,
    report,
    timestamp: new Date(),
    read: false,
  };
}


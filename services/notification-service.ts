/**
 * Notification Service - Handles in-app notifications for sensor alerts
 * 
 * Refactored to use Toast instead of Alert for a non-intrusive UX.
 */

import type { ToastData } from '@/components/common/toast';
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
 * Create toast data for sensor alerts (replaces Alert.alert)
 * The caller is responsible for displaying the toast.
 * 
 * @param report - The emergency report to create a toast for
 * @param onPress - Optional callback when the toast is pressed
 * @returns ToastData object ready for display
 */
export function createSensorAlertToast(
  report: EmergencyReport,
  onPress?: () => void
): ToastData {
  return {
    id: `toast-${report.id}-${Date.now()}`,
    title: report.title,
    message: `${report.description}\n📍 ${report.location}`,
    severity: report.severity,
    reportType: report.type,
    onPress,
  };
}

/**
 * Create toast data for status updates
 */
export function createStatusUpdateToast(
  reportId: string,
  title: string,
  status: 'pending' | 'acknowledged' | 'resolved',
  onPress?: () => void
): ToastData {
  const severityMap: Record<string, ToastData['severity']> = {
    pending: 'medium',
    acknowledged: 'medium',
    resolved: 'low',
  };

  const messageMap: Record<string, string> = {
    pending: `Report ${reportId} is now pending`,
    acknowledged: `Report ${reportId} is being handled`,
    resolved: `Report ${reportId} has been resolved`,
  };

  return {
    id: `status-toast-${reportId}-${Date.now()}`,
    title,
    message: messageMap[status] || `Status updated to ${status}`,
    severity: severityMap[status] || 'low',
    onPress,
  };
}

/**
 * Create toast data for error messages (replaces Alert.alert for errors)
 */
export function createErrorToast(
  message: string,
  title: string = 'Error'
): ToastData {
  return {
    id: `error-toast-${Date.now()}`,
    title,
    message,
    severity: 'high',
  };
}

/**
 * Create toast data for success messages
 */
export function createSuccessToast(
  message: string,
  title: string = 'Success'
): ToastData {
  return {
    id: `success-toast-${Date.now()}`,
    title,
    message,
    severity: 'low',
  };
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

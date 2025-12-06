/**
 * Notification Helper Functions
 * Utility functions for notification-related operations
 */

/**
 * Get icon name for notification based on type, severity, and report type
 */
export function getNotificationIcon(
  type: string,
  severity?: string,
  reportType?: string
): string {
  // Use report type for better icons
  if (reportType) {
    switch (reportType) {
      case 'fire':
        return 'flame';
      case 'suspicious':
        return severity === 'critical' ? 'alert-circle' : 'warning';
      case 'accident':
        return 'car';
      case 'medical':
        return 'medical';
      case 'crime':
        return 'shield';
      default:
        return 'notifications';
    }
  }
  
  // Fallback to type
  switch (type) {
    case 'sensor_alert':
      return 'hardware-chip';
    case 'report_update':
      return 'sync';
    case 'system':
      return 'information-circle';
    default:
      return 'notifications';
  }
}






/**
 * Notification API Service - Backend integration for persistent notifications
 * 
 * This service handles all API calls to the notification endpoints,
 * enabling persistent storage and retrieval of notifications.
 */

import { httpGet, httpPut } from '@/lib/axios';

// =============================================================================
// Types
// =============================================================================

// Notification type constants
export const NOTIFICATION_TYPES = {
  // Concern notification types
  TYPE_CONCERN_ASSIGNED: 'concern_assigned',
  TYPE_CONCERN_ACKNOWLEDGED: 'concern_acknowledged',
  TYPE_CONCERN_RESOLVED: 'concern_resolved',
  TYPE_CONCERN_STATUS_UPDATE: 'concern_status_update',
  TYPE_RESOLUTION_CONFIRMED: 'resolution_confirmed',
  TYPE_RESOLUTION_DISPUTED: 'resolution_disputed',
  // Anomaly notification types
  TYPE_ANOMALY_DETECTED: 'anomaly_detected',
  // System notification types
  TYPE_NEW_SAFETY_POST: 'new_safety_post',
  TYPE_SYSTEM_ANNOUNCEMENT: 'system_announcement',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Anomaly notification data structure (anomaly_detected)
export interface AnomalyDetectedData {
  anomaly_log_id: number;
  anomaly_type: 'sound_anomaly' | 'anti_tampering';
  anomaly_type_label: string;
  device_id?: string;
  iot_box_id: number;
  device_name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  details?: Record<string, any>;
}

// Concern notification data structure
export interface ConcernNotificationData {
  concern_id?: number;
  tracking_code?: string;
  category?: string;
  severity?: string;
}

export interface BackendNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: (ConcernNotificationData | AnomalyDetectedData | Record<string, any>) | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

export interface FetchNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: BackendNotification[];
    pagination: NotificationPagination;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch paginated notifications from the backend
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 20)
 * @param type - Optional notification type filter (e.g., 'anomaly_detected', 'concern_assigned')
 */
export async function fetchNotifications(
  page: number = 1,
  perPage: number = 20,
  type?: NotificationType | string
): Promise<FetchNotificationsResponse> {
  try {
    console.log('[NotificationAPI] 📥 Fetching notifications, page:', page, type ? `type: ${type}` : '');

    let url = `/api/v1/notifications?page=${page}&per_page=${perPage}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }

    const response = await httpGet<FetchNotificationsResponse>(url);

    console.log('[NotificationAPI] ✅ Fetched', response.data?.notifications?.length || 0, 'notifications');
    return response;
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get the count of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  try {
    console.log('[NotificationAPI] 📊 Fetching unread count...');

    const response = await httpGet<UnreadCountResponse>(
      '/api/v1/notifications/unread-count'
    );

    const count = response.data?.unread_count || 0;
    console.log('[NotificationAPI] ✅ Unread count:', count);
    return count;
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error fetching unread count:', error);
    return 0; // Return 0 on error to prevent UI issues
  }
}

/**
 * Mark a specific notification as read
 * @param notificationId - The notification ID to mark as read
 */
export async function markNotificationAsRead(
  notificationId: number | string
): Promise<void> {
  try {
    console.log('[NotificationAPI] ✓ Marking notification as read:', notificationId);

    await httpPut<MarkAsReadResponse>(
      `/api/v1/notifications/${notificationId}/read`
    );

    console.log('[NotificationAPI] ✅ Notification marked as read');
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    console.log('[NotificationAPI] ✓ Marking all notifications as read...');

    await httpPut<MarkAsReadResponse>(
      '/api/v1/notifications/mark-all-read'
    );

    console.log('[NotificationAPI] ✅ All notifications marked as read');
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error marking all as read:', error);
    throw error;
  }
}

/**
 * Delete a specific notification
 * @param notificationId - The notification ID to delete
 */
export async function deleteNotification(
  notificationId: number | string
): Promise<void> {
  try {
    console.log('[NotificationAPI] 🗑️ Deleting notification:', notificationId);

    // Note: Using httpPut with DELETE method - you may need httpDelete if available
    // For now, assuming DELETE endpoint exists
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me'}/api/v1/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    console.log('[NotificationAPI] ✅ Notification deleted');
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error deleting notification:', error);
    throw error;
  }
}

/**
 * Clear all notifications for the current user
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    console.log('[NotificationAPI] 🗑️ Clearing all notifications...');

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me'}/api/v1/notifications/clear`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Clear all failed: ${response.status}`);
    }

    console.log('[NotificationAPI] ✅ All notifications cleared');
  } catch (error) {
    console.error('[NotificationAPI] ❌ Error clearing all notifications:', error);
    throw error;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

// Normalized notification type for local use
export type LocalNotificationType = 'sensor_alert' | 'report_update' | 'new_report' | 'anomaly_detected' | 'system';

export interface NormalizedNotification {
  id: string;
  type: LocalNotificationType;
  title: string;
  message: string;
  reportId?: string;
  anomalyLogId?: number; // For anomaly notifications
  timestamp: Date;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reportType?: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  anomalyType?: string; // For anomaly notifications
  backendId: number;
  // Additional anomaly data
  anomalyData?: AnomalyDetectedData;
}

/**
 * Convert backend notification to local notification format
 * Used by notification context to normalize data
 * 
 * NOTE: For purok leaders:
 * - 'concern_assigned' (new reports) - SHOW
 * - 'anomaly_detected' (new anomaly from IoT) - SHOW
 * Status updates (acknowledged, resolved) are filtered out in notification-context
 * because purok leaders don't need notifications for their own actions.
 */
export function normalizeBackendNotification(
  backendNotification: BackendNotification
): NormalizedNotification {
  // Map backend notification type to local type
  const typeMap: Record<string, LocalNotificationType> = {
    'concern_assigned': 'new_report',        // New concern assigned - SHOW
    'concern_acknowledged': 'report_update', // Status update - filtered out
    'concern_resolved': 'report_update',     // Status update - filtered out
    'concern_status_update': 'report_update',// Status update - filtered out
    'resolution_confirmed': 'report_update',  // Citizen confirmed resolution - filtered out
    'resolution_disputed': 'report_update',   // Citizen disputed resolution - filtered out
    'anomaly_detected': 'anomaly_detected',  // New anomaly from IoT box - SHOW
    'new_safety_post': 'system',
    'system_announcement': 'system',
  };

  const data = backendNotification.data;
  const notifType = backendNotification.type;

  // Build the reportId with PUROK- prefix for concern notifications
  const concernId = (data as ConcernNotificationData)?.concern_id;
  const reportId = concernId ? `PUROK-${concernId}` : undefined;

  // Extract anomaly log ID for anomaly notifications
  const anomalyLogId = (data as AnomalyDetectedData)?.anomaly_log_id;
  const anomalyType = (data as AnomalyDetectedData)?.anomaly_type;

  // Override title based on notification type for cleaner display
  let title = backendNotification.title;
  if (notifType === 'concern_assigned') {
    title = 'New Concern';
  } else if (notifType === 'anomaly_detected') {
    const anomalyData = data as AnomalyDetectedData;
    title = anomalyData?.anomaly_type_label || 'Anomaly Detected';
  }

  return {
    id: `backend-${backendNotification.id}`,
    type: typeMap[notifType] || 'system',
    title,
    message: backendNotification.message,
    reportId,
    anomalyLogId,
    timestamp: new Date(backendNotification.created_at),
    read: backendNotification.read_at !== null,
    severity: (data as ConcernNotificationData)?.severity as any,
    reportType: (data as ConcernNotificationData)?.category as NormalizedNotification['reportType'],
    anomalyType,
    backendId: backendNotification.id,
    anomalyData: notifType === 'anomaly_detected'
      ? data as AnomalyDetectedData
      : undefined,
  };
}

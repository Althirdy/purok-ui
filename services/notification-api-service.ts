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

export interface BackendNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: {
    concern_id?: number;
    tracking_code?: string;
    category?: string;
    severity?: string;
    [key: string]: any;
  } | null;
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
 */
export async function fetchNotifications(
  page: number = 1,
  perPage: number = 20
): Promise<FetchNotificationsResponse> {
  try {
    console.log('[NotificationAPI] 📥 Fetching notifications, page:', page);
    
    const response = await httpGet<FetchNotificationsResponse>(
      `/api/v1/notifications?page=${page}&per_page=${perPage}`
    );
    
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

/**
 * Convert backend notification to local notification format
 * Used by notification context to normalize data
 */
export function normalizeBackendNotification(
  backendNotification: BackendNotification
): {
  id: string;
  type: 'sensor_alert' | 'report_update' | 'new_report' | 'system';
  title: string;
  message: string;
  reportId?: string;
  timestamp: Date;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reportType?: string;
  backendId: number;
} {
  // Map backend notification type to local type
  const typeMap: Record<string, 'sensor_alert' | 'report_update' | 'new_report' | 'system'> = {
    'concern_assigned': 'new_report',
    'concern_acknowledged': 'report_update',
    'concern_resolved': 'report_update',
    'concern_status_update': 'report_update',
    'new_safety_post': 'system',
    'system_announcement': 'system',
  };

  // Build the reportId with PUROK- prefix to match the format used in purok-leader-service
  // This ensures clicking notifications navigates to the correct report
  const concernId = backendNotification.data?.concern_id;
  const reportId = concernId ? `PUROK-${concernId}` : undefined;

  return {
    id: `backend-${backendNotification.id}`,
    type: typeMap[backendNotification.type] || 'system',
    title: backendNotification.title,
    message: backendNotification.message,
    reportId,
    timestamp: new Date(backendNotification.created_at),
    read: backendNotification.read_at !== null,
    severity: backendNotification.data?.severity as any,
    reportType: backendNotification.data?.category,
    backendId: backendNotification.id,
  };
}

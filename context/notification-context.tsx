/**
 * Notification Context - Manages in-app notifications from alerts and reports
 * 
 * Integrates with backend API for persistent notification storage
 * - Fetches notifications from backend on login
 * - Syncs read status with backend
 * - Merges real-time Pusher notifications with API data
 */

import {
  fetchNotifications as apiFetchNotifications,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  markNotificationAsRead as apiMarkAsRead,
  normalizeBackendNotification,
  NOTIFICATION_TYPES,
  type AnomalyDetectedData,
  type BackendNotification,
  type LocalNotificationType,
} from '@/services/notification-api-service';
import {
  subscribeToPublicPosts,
  type SafetyPostPublishedPayload,
} from '@/services/realtime-service';
import type { EmergencyReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';

export interface Notification {
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
  backendId?: number; // ID from backend for syncing
  anomalyData?: AnomalyDetectedData; // Additional anomaly data
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  addNotificationFromReport: (report: EmergencyReport) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  unreadCount: number;
  clearAll: () => void;
  fetchFromBackend: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = '@urbanwatch:purok:notifications';
const CLEARED_AT_STORAGE_KEY = '@urbanwatch:purok:notifications_cleared_at';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const clearedAtRef = useRef<string | null>(null);
  const hasFetchedFromBackend = useRef(false);
  const { isAuthenticated, accessToken, user } = useAuth();

  // Load clearedAt timestamp on mount
  useEffect(() => {
    AsyncStorage.getItem(CLEARED_AT_STORAGE_KEY).then(val => {
      if (val) {
        clearedAtRef.current = val;
        console.log('[NotificationContext] 🗑️ Loaded clearedAt from storage:', val);
      }
    });
  }, []);

  // Load notifications from storage on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Save notifications to storage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications();
    }
  }, [notifications]);

  // Fetch from backend when user logs in
  useEffect(() => {
    if (isAuthenticated && accessToken && !hasFetchedFromBackend.current) {
      console.log('[NotificationContext] 🔑 User logged in, fetching notifications from backend...');
      fetchFromBackendInternal();
    } else if (!isAuthenticated) {
      // User logged out, reset state
      hasFetchedFromBackend.current = false;
    }
  }, [isAuthenticated, accessToken]);

  // Periodic polling for notifications (every 30 seconds)
  // Keeps the bell badge and notification list in sync without manual refresh
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const pollInterval = setInterval(() => {
      console.log('[NotificationContext] ⏰ Periodic poll - refreshing notifications...');
      fetchFromBackendInternal(true);
    }, 30000); // 30 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, accessToken]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      console.log('[NotificationContext] 📂 Loading notifications from storage...');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));

        // Filter out old status update notifications EXCEPT citizen confirmation responses
        // Keep: new_report, report_update (confirmation declined/confirmed), backend notifications
        const filtered = withDates.filter((n: Notification) =>
          n.backendId || n.type === 'new_report' || n.type === 'report_update'
        );

        if (filtered.length !== withDates.length) {
          console.log('[NotificationContext] 🧹 Cleaned up', withDates.length - filtered.length, 'old status update notifications');
          // Save the cleaned list back to storage
          await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filtered));
        }

        console.log('[NotificationContext] 📂 Loaded notifications:', filtered.length);
        setNotifications(filtered);
      } else {
        console.log('[NotificationContext] 📂 No stored notifications found');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async () => {
    try {
      // Limit to last 100 notifications to prevent storage bloat
      const toSave = notifications.slice(0, 100);
      console.log('[NotificationContext] 💾 Saving notifications:', toSave.length);
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  /**
   * Fetch notifications from the backend API (internal implementation)
   * Called when user logs in to sync with persistent storage
   * @param force - If true, bypasses the hasFetchedFromBackend check
   */
  const fetchFromBackendInternal = async (force: boolean = false) => {
    if (isLoading) return;

    // Skip if already fetched (unless forced)
    if (!force && hasFetchedFromBackend.current) {
      console.log('[NotificationContext] ⏭️ Already fetched from backend, skipping (use force=true to refetch)');
      return;
    }

    console.log('[NotificationContext] 🌐 Fetching notifications from backend...');
    setIsLoading(true);

    try {
      const response = await apiFetchNotifications(1, 50);

      console.log('[NotificationContext] 📥 API Response:', JSON.stringify(response, null, 2).substring(0, 500));

      // Handle different response structures
      // Could be: { success, data: { notifications } } or { notifications } or { data: [...] }
      let backendNotifications: BackendNotification[] = [];

      if (response.success && response.data?.notifications) {
        backendNotifications = response.data.notifications;
      } else if (Array.isArray((response as any).notifications)) {
        backendNotifications = (response as any).notifications;
      } else if (Array.isArray((response as any).data)) {
        backendNotifications = (response as any).data;
      }

      console.log('[NotificationContext] ✅ Received', backendNotifications.length, 'notifications from backend');

      if (backendNotifications.length > 0) {
        console.log('[NotificationContext] 📋 First notification:', JSON.stringify(backendNotifications[0]));
      } else {
        console.log('[NotificationContext] ⚠️ No notifications found in backend');
      }

      // Filter: Only show NEW concern assignments and anomaly notifications
      // 1. 'concern_assigned' type (new reports)
      // 2. 'anomaly_detected' type (new anomaly from IoT box)
      const relevantTypes = [
        NOTIFICATION_TYPES.TYPE_CONCERN_ASSIGNED,
        NOTIFICATION_TYPES.TYPE_ANOMALY_DETECTED,
      ];
      let filteredBackendNotifications = backendNotifications.filter(
        n => relevantTypes.includes(n.type as any)
      );

      // 🗑️ Filter out notifications that were created before the last "Clear All"
      const clearedAt = clearedAtRef.current;
      if (clearedAt) {
        const clearedAtMs = new Date(clearedAt).getTime();
        const beforeCount = filteredBackendNotifications.length;
        filteredBackendNotifications = filteredBackendNotifications.filter(n => {
          const notifTime = new Date(n.created_at).getTime();
          return notifTime > clearedAtMs;
        });
        console.log('[NotificationContext] 🗑️ Clear-all filter: removed', beforeCount - filteredBackendNotifications.length, 'of', beforeCount, '(cleared at:', clearedAt, ')');
      }

      // 🔒 Purok-based filtering for anomaly notifications
      // Only show anomalies from devices in the purok leader's assigned purok
      const userPurokName = user?.purokName;
      if (userPurokName) {
        const purokNameLower = userPurokName.toLowerCase();
        console.log('[NotificationContext] 🏘️ Filtering anomalies for purok:', userPurokName);

        filteredBackendNotifications = filteredBackendNotifications.filter(n => {
          // Only filter anomaly notifications - let concerns through
          if (n.type !== NOTIFICATION_TYPES.TYPE_ANOMALY_DETECTED) return true;

          const anomalyData = n.data as AnomalyDetectedData | null;
          if (!anomalyData) return true; // No data = fail-open, keep it

          // Check if location contains user's purok name
          const location = (anomalyData.location || '').toLowerCase();
          const deviceName = (anomalyData.device_name || '').toLowerCase();

          // Match by location or device name containing the purok name
          const matchesLocation = location.includes(purokNameLower);
          const matchesDevice = deviceName.includes(purokNameLower);

          if (!matchesLocation && !matchesDevice) {
            // If neither location nor device contains purok info, check if there's ANY purok
            // reference. If there is, it's from another purok. If there isn't, fail-open.
            const hasPurokReference = /purok\s*\d/i.test(location) || /purok\s*\d/i.test(deviceName);
            if (hasPurokReference) {
              console.log('[NotificationContext] 🚫 Filtering out anomaly from different purok:', {
                anomalyId: anomalyData.anomaly_log_id,
                location: anomalyData.location,
                deviceName: anomalyData.device_name,
                userPurok: userPurokName,
              });
              return false;
            }
            // No purok reference at all - fail-open, keep notification
            return true;
          }

          return true;
        });

        console.log('[NotificationContext] 🏘️ After purok filtering:', filteredBackendNotifications.length, 'notifications');
      }

      console.log('[NotificationContext] 🔍 Filtered to', filteredBackendNotifications.length, 'unread notifications (concerns + anomalies)');

      // Convert and merge with existing notifications
      setNotifications(prev => {
        const normalizedBackend = filteredBackendNotifications.map(normalizeBackendNotification);

        // Create a map to track existing backend IDs
        const existingBackendIds = new Set(
          prev.filter(n => n.backendId).map(n => n.backendId)
        );

        // Filter out duplicates
        const newFromBackend = normalizedBackend.filter(
          n => !existingBackendIds.has(n.backendId)
        );

        // Filter local notifications: keep new_report AND report_update (citizen confirmation responses)
        const localOnly = prev.filter(n => !n.backendId && (n.type === 'new_report' || n.type === 'report_update'));

        // Merge: backend notifications + local-only NEW REPORT notifications only
        const merged = [...normalizedBackend, ...localOnly];

        // Sort by timestamp (newest first) and limit
        merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        console.log('[NotificationContext] 📊 Merged total:', merged.length);
        return merged.slice(0, 100);
      });

      hasFetchedFromBackend.current = true;
    } catch (error) {
      console.error('[NotificationContext] ❌ Error fetching from backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exposed function to manually fetch from backend (e.g., pull to refresh)
   * Always forces a fresh fetch from the backend
   */
  const fetchFromBackend = useCallback(async () => {
    console.log('[NotificationContext] 🔄 Manual fetch requested (forced)');
    await fetchFromBackendInternal(true); // Force fetch
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    console.log('[NotificationContext] 🔔 addNotification called with:', notification);
    setNotifications(prev => {
      // Check if notification already exists (prevent duplicates)
      if (prev.some(n => n.id === notification.id)) {
        console.log('[NotificationContext] ⚠️ Notification already exists, skipping:', notification.id);
        return prev;
      }
      // Add new notification at the beginning (newest first)
      const updated = [notification, ...prev];
      console.log('[NotificationContext] ✅ Notification added, total:', updated.length);
      return updated;
    });
  }, []);

  // Subscribe to public-posts channel for real-time safety post notifications
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        console.log('[NotificationContext] 📢 Setting up public-posts subscription...');
        unsubscribe = await subscribeToPublicPosts((post: SafetyPostPublishedPayload) => {
          console.log('[NotificationContext] 📢 Received safety post:', post.id, post.title);

          // Convert SafetyPostPublishedPayload to local Notification object
          const notification: Notification = {
            id: `safety-post-${post.id}-${Date.now()}`,
            type: 'safety_post' as LocalNotificationType,
            title: post.title,
            message: post.content,
            timestamp: new Date(post.published_at || post.created_at),
            read: false,
            severity: post.severity || 'low',
          };

          addNotification(notification);
        });
        console.log('[NotificationContext] ✅ Public-posts subscription active');
      } catch (error) {
        console.error('[NotificationContext] ❌ Failed to subscribe to public-posts:', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        console.log('[NotificationContext] 🔌 Cleaning up public-posts subscription');
        unsubscribe();
      }
    };
  }, [addNotification]);

  const addNotificationFromReport = useCallback((report: EmergencyReport) => {
    const notification: Notification = {
      id: `notif-${report.id}-${Date.now()}`,
      type: 'sensor_alert',
      title: report.title,
      message: report.description,
      reportId: report.id,
      timestamp: new Date(),
      read: false,
      severity: report.severity,
      reportType: report.type,
    };
    addNotification(notification);
  }, [addNotification]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);

      // If notification has a backend ID, sync with backend
      if (notification?.backendId) {
        apiMarkAsRead(notification.backendId).catch(error => {
          console.error('[NotificationContext] ❌ Failed to sync read status:', error);
        });
      }

      return prev.map(n => (n.id === notificationId ? { ...n, read: true } : n));
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    // Sync with backend
    apiMarkAllAsRead().catch(error => {
      console.error('[NotificationContext] ❌ Failed to sync mark all as read:', error);
    });

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    // Mark all as read on backend
    apiMarkAllAsRead().catch(error => {
      console.error('[NotificationContext] ❌ Failed to mark all as read on backend:', error);
    });

    // Save the timestamp of when Clear All was pressed (use ref for immediate access)
    const now = new Date().toISOString();
    clearedAtRef.current = now;
    console.log('[NotificationContext] 🗑️ Clear All pressed, setting clearedAt:', now);
    AsyncStorage.setItem(CLEARED_AT_STORAGE_KEY, now).catch(error => {
      console.error('[NotificationContext] ❌ Failed to save cleared timestamp:', error);
    });

    // Clear locally
    setNotifications([]);

    // Also clear from AsyncStorage
    AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY).catch(error => {
      console.error('[NotificationContext] ❌ Failed to clear storage:', error);
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        addNotificationFromReport,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount,
        clearAll,
        fetchFromBackend,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}


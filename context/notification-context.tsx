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
    type BackendNotification,
} from '@/services/notification-api-service';
import type { EmergencyReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-context';

export interface Notification {
  id: string;
  type: 'sensor_alert' | 'report_update' | 'new_report' | 'system';
  title: string;
  message: string;
  reportId?: string;
  timestamp: Date;
  read: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reportType?: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  backendId?: number; // ID from backend for syncing
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedFromBackend = useRef(false);
  const { isAuthenticated, accessToken } = useAuth();

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
        console.log('[NotificationContext] 📂 Loaded notifications:', withDates.length);
        setNotifications(withDates);
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
      
      // Filter: Only show NEW concern assignments that are UNREAD
      // 1. Only 'concern_assigned' type (not status updates)
      // 2. Only unread (read_at is null)
      const newReportTypes = ['concern_assigned'];
      const filteredBackendNotifications = backendNotifications.filter(
        n => newReportTypes.includes(n.type) && n.read_at === null
      );
      
      console.log('[NotificationContext] 🔍 Filtered to', filteredBackendNotifications.length, 'unread new report notifications');
      
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
        
        // Also filter out local notifications that now exist in backend
        const localOnly = prev.filter(n => !n.backendId);
        
        // Merge: backend notifications + local-only notifications
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
    // Mark all as read on backend so they don't come back on refresh
    apiMarkAllAsRead().catch(error => {
      console.error('[NotificationContext] ❌ Failed to mark all as read on backend:', error);
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


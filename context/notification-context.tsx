/**
 * Notification Context - Manages in-app notifications from alerts and reports
 */

import { createNotificationFromReport } from '@/services/notification-service';
import type { EmergencyReport } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = '@urbanwatch:notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from storage on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Save notifications to storage whenever they change
  useEffect(() => {
    saveNotifications();
  }, [notifications]);

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
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
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


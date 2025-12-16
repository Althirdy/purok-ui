/**
 * Notification Service - Similar to uw-citizen
 * Handles push notifications with sound for new reports
 * 
 * NOTE: expo-notifications requires a development build (not Expo Go)
 * This service will gracefully fallback to console logs in Expo Go
 */

import { Platform } from 'react-native';

// Check if we're in Expo Go (expo-notifications doesn't work in Expo Go)
const isExpoGo = () => {
  try {
    // In Expo Go, Constants.executionEnvironment is 'storeClient'
    // In development build, it's 'standalone' or 'bare'
    const Constants = require('expo-constants');
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

let Notifications: any = null;
let notificationsAvailable = false;

// Try to load expo-notifications (will fail in Expo Go)
try {
  Notifications = require('expo-notifications');
  notificationsAvailable = true;
} catch (error) {
  console.warn('⚠️ expo-notifications not available (likely using Expo Go)');
  notificationsAvailable = false;
}

/**
 * Configure notification behavior
 * Shows alerts, plays sounds, and updates badge counts for all notifications
 * 
 * NOTE: Only works in development builds, not Expo Go
 */
export const configureNotifications = () => {
  if (!notificationsAvailable || isExpoGo()) {
    console.log('⚠️ Notifications not available (using Expo Go or not installed)');
    console.log('💡 Use toast notifications and haptic feedback instead');
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    console.log('✅ Notifications configured');
  } catch (error) {
    console.error('❌ Error configuring notifications:', error);
  }
};

/**
 * Request notification permissions
 * 
 * NOTE: Only works in development builds, not Expo Go
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!notificationsAvailable || isExpoGo()) {
    console.log('⚠️ Cannot request notification permissions (using Expo Go)');
    return false;
  }

  try {
    // Configure notification channel for Android BEFORE requesting permissions
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('report-updates', {
        name: 'Report Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1e3a8a',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return false;
    }

    console.log('✅ Notification permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a local notification with sound
 * 
 * NOTE: Only works in development builds, not Expo Go
 * In Expo Go, this will just log to console (toast notifications still work)
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  if (!notificationsAvailable || isExpoGo()) {
    // In Expo Go, just log (toast notifications will still show)
    console.log('📢 [Notification]', title, '-', body);
    return;
  }

  try {
    // Check if notifications are available
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Notification permissions not granted, skipping notification');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true, // This plays the default notification sound
        ...(Platform.OS === 'android' && {
          channelId: 'report-updates',
        }),
      },
      trigger: null, // Show immediately
    });
    console.log('✅ Notification scheduled:', title);
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    // Don't throw - fail silently to prevent app crashes
  }
};

/**
 * Get notification badge count
 * 
 * NOTE: Only works in development builds, not Expo Go
 */
export const getBadgeCount = async (): Promise<number> => {
  if (!notificationsAvailable || isExpoGo()) {
    return 0;
  }

  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('❌ Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set notification badge count
 * 
 * NOTE: Only works in development builds, not Expo Go
 */
export const setBadgeCount = async (count: number) => {
  if (!notificationsAvailable || isExpoGo()) {
    return;
  }

  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('❌ Error setting badge count:', error);
  }
};

/**
 * Clear all notifications
 * 
 * NOTE: Only works in development builds, not Expo Go
 */
export const clearAllNotifications = async () => {
  if (!notificationsAvailable || isExpoGo()) {
    return;
  }

  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
};


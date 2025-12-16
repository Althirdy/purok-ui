/**
 * Notification Sound Utility
 * DEPRECATED: Use expo-notifications instead (services/notifications.ts)
 * This file is kept for backward compatibility but will be removed
 * 
 * The new notification system uses expo-notifications which automatically
 * plays sound when notifications are scheduled.
 */

/**
 * Play notification feedback (haptic vibration)
 * NOTE: This is now deprecated. Use scheduleNotification from services/notifications.ts instead
 * which automatically plays sound via expo-notifications
 */
export async function playNotificationSound(): Promise<void> {
  try {
    // Haptic feedback (vibration) - works on all devices
    const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
    
    // Use medium impact for regular notifications
    impactAsync(ImpactFeedbackStyle.Medium);
    
    console.log('[NotificationSound] 🔔 Haptic feedback triggered (deprecated - use expo-notifications)');
  } catch (error) {
    console.error('[NotificationSound] Error with notification feedback:', error);
  }
}


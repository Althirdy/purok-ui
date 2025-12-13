/**
 * Notifications Screen - Alert and notification center
 */

import { Card } from '@/components/common/card';
import { NotificationSkeleton } from '@/components/news/notification-skeleton';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useNotifications, type Notification } from '@/context/notification-context';
import { getNotificationIcon } from '@/utils/notificationHelpers';
import { formatTimestamp } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

// Inline styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  markAllRead: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.blue,
  },
  unreadSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  unreadText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  notificationCard: {
    marginBottom: spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerUnread: {
    backgroundColor: `${colors.primary.blue}20`,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.blue,
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
  },
});

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to report if it has a reportId
    if (notification.reportId) {
      router.push({ pathname: 'report-details', params: { reportId: notification.reportId } } as any);
    }
  }, [markAsRead]);

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const iconColor = item.read 
      ? colors.text.secondary 
      : (item.severity === 'critical' ? colors.semantic.error : colors.accent.orange);
    
    return (
      <Card 
        onPress={() => handleNotificationPress(item)} 
        style={styles.notificationCard}
      >
        <View style={styles.notificationContent}>
          <View style={[
            styles.iconContainer,
            !item.read && styles.iconContainerUnread,
          ]}>
            <Ionicons 
              name={getNotificationIcon(item.type, item.severity, item.reportType) as any} 
              size={24} 
              color={iconColor} 
            />
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.notificationTitle,
                !item.read && styles.notificationTitleUnread,
              ]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
      </Card>
    );
  }, [handleNotificationPress]);

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadSection}>
          <Text style={styles.unreadText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={keyExtractor}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 5 }).map((_, index) => (
                <NotificationSkeleton key={`skeleton-${index}`} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={colors.neutral.gray600} />
              <Text style={styles.emptyStateText}>No notifications</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

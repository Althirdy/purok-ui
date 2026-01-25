/**
 * Notifications Screen - Exactly like uw-citizen
 */

import { NotificationSkeleton } from '@/components/news/notification-skeleton';
import { useNotifications, type Notification } from '@/context/notification-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (timestamp: Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (title: string): string => {
  if (title.includes('Resolved')) return 'checkmark-circle';
  if (title.includes('Acknowledged')) return 'time';
  if (title.includes('New')) return 'notifications';
  return 'sync';
};

const getNotificationColor = (title: string): string => {
  if (title.includes('Resolved')) return '#22c55e';
  if (title.includes('Acknowledged')) return '#3b82f6';
  if (title.includes('New') || title.includes('Report')) return '#f59e0b';
  return '#1e3a8a';
};

export default function NotificationsScreen() {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debug: Log notifications when they change
  useEffect(() => {
    console.log('[NotificationsScreen] 📋 Notifications count:', notifications.length);
    console.log('[NotificationsScreen] 📋 Notifications:', notifications.map(n => ({
      id: n.id,
      title: n.title,
      type: n.type,
      read: n.read,
    })));
  }, [notifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.reportId) {
      router.push({ pathname: 'report-details', params: { reportId: notification.reportId } } as any);
    }
  }, [markAsRead]);

  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.title);
    const iconColor = getNotificationColor(item.title);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, item.read && styles.notificationItemRead]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationDate}>{formatDate(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }, [handleNotificationPress]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        You'll see updates about concerns here
      </Text>
    </View>
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#1e3a8a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          data={isLoading ? [] : notifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.skeletonContainer}>
                <NotificationSkeleton count={6} />
              </View>
            ) : renderEmpty()
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e3a8a" />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e3a8a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationItemRead: {
    backgroundColor: '#f8fafc',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

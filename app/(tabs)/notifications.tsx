/**
 * Notifications Screen - With filter tabs for Concerns, Anomalies, and Safety News
 */

import { NotificationSkeleton } from '@/components/news/notification-skeleton';
import { useNotifications, type Notification } from '@/context/notification-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Filter tab types
type NotificationFilter = 'all' | 'concerns' | 'anomalies' | 'news';

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

const getNotificationIcon = (type: string, title: string): string => {
  // Check notification type first
  if (type === 'anomaly_detected') return 'alert-circle';
  if (type === 'system') return 'newspaper-outline';
  if (type === 'new_report') return 'document-text-outline';
  // Fall back to title-based detection for legacy notifications
  if (title.includes('Resolved')) return 'checkmark-circle';
  if (title.includes('Acknowledged')) return 'time';
  if (title.includes('New') || title.includes('Anomaly')) return 'notifications';
  return 'sync';
};

const getNotificationColor = (type: string, title: string): string => {
  // Check notification type first
  if (type === 'anomaly_detected') return '#f59e0b'; // Amber for anomalies
  if (type === 'system') return '#8b5cf6'; // Purple for news/system
  if (type === 'new_report') return '#3b82f6'; // Blue for concerns
  // Fall back to title-based detection for legacy notifications
  if (title.includes('Resolved')) return '#22c55e';
  if (title.includes('Acknowledged')) return '#3b82f6';
  if (title.includes('New') || title.includes('Report')) return '#f59e0b';
  return '#1e3a8a';
};

export default function NotificationsScreen() {
  const { notifications, markAsRead, fetchFromBackend, clearAll, isLoading: isContextLoading } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    
    return notifications.filter(n => {
      switch (activeFilter) {
        case 'concerns':
          // Concerns: new_report, report_update, sensor_alert
          return n.type === 'new_report' || n.type === 'report_update' || n.type === 'sensor_alert';
        case 'anomalies':
          // Anomalies: anomaly_detected
          return n.type === 'anomaly_detected';
        case 'news':
          // News/System: system notifications
          return n.type === 'system';
        default:
          return true;
      }
    });
  }, [notifications, activeFilter]);

  // Count notifications by type
  const notificationCounts = useMemo(() => {
    const concerns = notifications.filter(n => 
      n.type === 'new_report' || n.type === 'report_update' || n.type === 'sensor_alert'
    ).length;
    const anomalies = notifications.filter(n => n.type === 'anomaly_detected').length;
    const news = notifications.filter(n => n.type === 'system').length;
    
    return { all: notifications.length, concerns, anomalies, news };
  }, [notifications]);

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

  // Force UI update when screen gains focus (e.g., switching tabs)
  // This ensures new notifications added via Pusher while on other screens appear immediately
  useFocusEffect(
    useCallback(() => {
      console.log('[NotificationsScreen] 👁️ Screen focused - notifications count:', notifications.length);
      // The notifications from context should already be up-to-date
      // This effect just ensures the screen knows it's focused
    }, [notifications.length])
  );

  // Fetch from backend when screen mounts
  useEffect(() => {
    console.log('[NotificationsScreen] 📱 Screen mounted, fetching notifications...');
    fetchFromBackend();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('[NotificationsScreen] 🔄 Pull to refresh - fetching from backend...');
      await fetchFromBackend();
    } catch (error) {
      console.error('[NotificationsScreen] ❌ Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFromBackend]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle anomaly notifications - navigate to anomaly details
    if (notification.type === 'anomaly_detected') {
      if (notification.anomalyLogId) {
        router.push({ pathname: 'anomaly-details', params: { anomalyId: notification.anomalyLogId.toString() } } as any);
      }
      return;
    }
    
    // Handle concern notifications - navigate to report details
    if (notification.reportId) {
      router.push({ pathname: 'report-details', params: { reportId: notification.reportId } } as any);
    }
  }, [markAsRead]);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type, item.title);
    const iconColor = getNotificationColor(item.type, item.title);

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

  const renderEmpty = () => {
    const emptyMessages: Record<NotificationFilter, { text: string; subtext: string }> = {
      all: { text: 'No notifications yet', subtext: 'You\'ll see updates here' },
      concerns: { text: 'No concern updates', subtext: 'Updates about citizen concerns will appear here' },
      anomalies: { text: 'No anomaly alerts', subtext: 'IoT anomaly detections will appear here' },
      news: { text: 'No safety news', subtext: 'Safety news and announcements will appear here' },
    };
    
    const { text, subtext } = emptyMessages[activeFilter];
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>{text}</Text>
        <Text style={styles.emptySubtext}>{subtext}</Text>
      </View>
    );
  };

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            console.log('[NotificationsScreen] 🗑️ Clearing all notifications...');
            clearAll();
          },
        },
      ]
    );
  }, [notifications.length, clearAll]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#1e3a8a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.clearButtonPlaceholder} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="list-outline" 
              size={16} 
              color={activeFilter === 'all' ? '#ffffff' : '#94a3b8'} 
            />
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
            {notificationCounts.all > 0 && (
              <View style={[styles.filterBadge, activeFilter === 'all' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === 'all' && styles.filterBadgeTextActive]}>
                  {notificationCounts.all}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'concerns' && styles.filterTabActive]}
            onPress={() => setActiveFilter('concerns')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="document-text-outline" 
              size={16} 
              color={activeFilter === 'concerns' ? '#ffffff' : '#94a3b8'} 
            />
            <Text style={[styles.filterTabText, activeFilter === 'concerns' && styles.filterTabTextActive]}>
              Concerns
            </Text>
            {notificationCounts.concerns > 0 && (
              <View style={[styles.filterBadge, activeFilter === 'concerns' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === 'concerns' && styles.filterBadgeTextActive]}>
                  {notificationCounts.concerns}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'anomalies' && styles.filterTabActive]}
            onPress={() => setActiveFilter('anomalies')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="alert-circle-outline" 
              size={16} 
              color={activeFilter === 'anomalies' ? '#ffffff' : '#94a3b8'} 
            />
            <Text style={[styles.filterTabText, activeFilter === 'anomalies' && styles.filterTabTextActive]}>
              Anomalies
            </Text>
            {notificationCounts.anomalies > 0 && (
              <View style={[styles.filterBadge, activeFilter === 'anomalies' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === 'anomalies' && styles.filterBadgeTextActive]}>
                  {notificationCounts.anomalies}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'news' && styles.filterTabActive]}
            onPress={() => setActiveFilter('news')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="newspaper-outline" 
              size={16} 
              color={activeFilter === 'news' ? '#ffffff' : '#94a3b8'} 
            />
            <Text style={[styles.filterTabText, activeFilter === 'news' && styles.filterTabTextActive]}>
              Safety News
            </Text>
            {notificationCounts.news > 0 && (
              <View style={[styles.filterBadge, activeFilter === 'news' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === 'news' && styles.filterBadgeTextActive]}>
                  {notificationCounts.news}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          data={isLoading ? [] : filteredNotifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          extraData={[filteredNotifications.length, activeFilter]} // Re-render on filter change
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPlaceholder: {
    minWidth: 70,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Filter Tabs
  filterTabsContainer: {
    backgroundColor: '#1e3a8a',
    paddingBottom: 12,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  // Content
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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

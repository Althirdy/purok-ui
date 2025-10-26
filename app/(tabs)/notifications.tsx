/**
 * Notifications Screen - Alert and notification center
 */

import { Card } from '@/components/common/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'update';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'alert',
    title: 'New Emergency Report',
    message: 'A new emergency report has been filed in your area.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: 'notif-002',
    type: 'info',
    title: 'Report Resolved',
    message: 'Report #report-003 has been marked as resolved.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: 'notif-003',
    type: 'update',
    title: 'System Update',
    message: 'UrbanWatch system has been updated to version 2.1.0',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
];

export default function NotificationsScreen() {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return 'exclamationmark.triangle.fill';
      case 'info':
        return 'info.circle.fill';
      case 'update':
        return 'arrow.triangle.2.circlepath';
      default:
        return 'bell.fill';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card onPress={() => console.log('Notification pressed:', item.id)} style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          !item.read && styles.iconContainerUnread,
        ]}>
          <IconSymbol 
            name={getNotificationIcon(item.type) as any} 
            size={24} 
            color={item.read ? colors.text.secondary : colors.accent.orange} 
          />
        </View>
        
        <View style={styles.textContent}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.notificationTitleUnread,
            ]}>
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

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
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
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="bell.slash.fill" size={64} color={colors.neutral.gray600} />
            <Text style={styles.emptyStateText}>No notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

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
    color: colors.accent.orange,
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
    backgroundColor: `${colors.accent.orange}20`,
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
    backgroundColor: colors.accent.orange,
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
});


/**
 * Notifications Screen - Alert and notification center
 */

import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './notifications.styles';

const { colors } = DesignSystem;

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'update';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const mockNotifications: Notification[] = [];

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
        return 'warning';
      case 'info':
        return 'information-circle';
      case 'update':
        return 'sync';
      default:
        return 'notifications';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card onPress={() => console.log('Notification pressed:', item.id)} style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          !item.read && styles.iconContainerUnread,
        ]}>
          <Ionicons 
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
            <Ionicons name="notifications-off-outline" size={64} color={colors.neutral.gray600} />
            <Text style={styles.emptyStateText}>No notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

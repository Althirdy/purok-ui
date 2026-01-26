/**
 * Profile Screen - Purok profile, styled like citizen app profile
 */

import { DesignSystem, scale, moderateScale } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { ProfileSkeleton } from '@/components/profile/profile-skeleton';
import { getInitials } from '@/utils/userHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { spacing, typography } = DesignSystem;

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }, [refreshUser]),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleHelpSupport = () => {
    showToast({
      id: 'help-support',
      title: 'Help & Support',
      message: 'This option will be available in a future update.',
      severity: 'medium',
    });
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={globalStyles.container} edges={['top']}>
        <View style={styles.appBar}>
          <View style={styles.appBarContent}>
            <View>
              <Text style={styles.appTitle}>UrbanWatch</Text>
              <Text style={styles.appSubtitle}>Purok Profile</Text>
            </View>
            <View style={styles.appBarAvatar}>
              <Ionicons name="person" size={20} color="#1e3a8a" />
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <View style={styles.appBar}>
        <View style={styles.appBarContent}>
          <View>
            <Text style={styles.appTitle}>UrbanWatch</Text>
            <Text style={styles.appSubtitle}>Purok Profile</Text>
          </View>
          <View style={styles.appBarAvatar}>
            <Ionicons name="person" size={20} color="#1e3a8a" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.verificationBadge}>
              <Ionicons name="time-outline" size={24} color="#f59e0b" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Purok Leader'}</Text>
          <Text style={styles.userRole}>Purok Leader</Text>
          <View style={styles.verificationStatus}>
            <Text style={[styles.verificationText, { color: '#f59e0b' }]}>
              Pending Verification
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.profileItem}>
            <View style={styles.profileItemHeader}>
              <Ionicons name="mail-outline" size={20} color="#1e3a8a" />
              <Text style={styles.profileItemLabel}>Email Address</Text>
            </View>
            <Text style={styles.profileItemValue}>
              {user?.email || 'No email provided'}
            </Text>
          </View>

          <View style={styles.profileItem}>
            <View style={styles.profileItemHeader}>
              <Ionicons name="call-outline" size={20} color="#1e3a8a" />
              <Text style={styles.profileItemLabel}>Phone Number</Text>
            </View>
            <Text style={styles.profileItemValue}>
              {user?.phoneNumber || 'No phone number provided'}
            </Text>
          </View>

        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItemNoBorder}
            onPress={handleHelpSupport}
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#1e3a8a" />
              <Text style={styles.settingItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>UrbanWatch Purok v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(16),
  },
  appTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  appSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: '#bfdbfe',
  },
  appBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(24),
    backgroundColor: '#ffffff',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  avatarText: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: scale(12),
    padding: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  verificationStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  profileItem: {
    marginBottom: 16,
  },
  profileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 28,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingItemNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
    width: '80%',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  versionText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});

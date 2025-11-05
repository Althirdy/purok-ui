/**
 * Profile Screen - User profile information
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/contexts/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

// Inline styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  profileSettingsButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.text.primary,
    alignItems: 'center',
  },
  profileSettingsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  actionButtons: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.text.primary,
    gap: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
});

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Refresh user data whenever the profile screen gains focus
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      refreshUser().finally(() => setIsLoading(false));
    }, [refreshUser])
  );
  const initials = (user?.name || 'User')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleProfileSettings = () => {
    router.push('./profile-settings');
  };

  const handleChangePin = () => {
    Alert.alert('Change PIN', 'This feature will be implemented soon.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => { await logout(); router.replace('/(auth)/login'); }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Purok Leader'}</Text>
          <Text style={styles.userEmail}>{user?.purokName || ''}</Text>
          {/* Personal info when available */}
          {(user?.email || user?.phoneNumber || user?.address) && (
            <View style={{ width: '100%', marginTop: spacing.lg }}>
              <View style={{ backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.border.light, borderRadius: 14, padding: spacing.lg }}>
                <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.md }}>Personal Information</Text>
                {user?.email && (
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.xs }}>Email Address</Text>
                    <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.sm }}>{user.email}</Text>
                  </View>
                )}
                {user?.phoneNumber && (
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.xs }}>Phone Number</Text>
                    <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.sm }}>{user.phoneNumber}</Text>
                  </View>
                )}
                {user?.address && (
                  <View>
                    <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.xs }}>Address</Text>
                    <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.sm }}>{user.address}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Profile Settings removed for purok leader profile */}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleChangePin}>
            <Ionicons name="lock-closed" size={24} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Change Pin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {isLoading && <LoadingSpinner />}
    </SafeAreaView>
  );
}


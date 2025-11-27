/**
 * Profile Screen - User profile information
 */

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/contexts/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius } = DesignSystem;

function formatFullName(userName?: string) {
  if (!userName) return 'Purok Leader';
  return userName;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.card,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    ...DesignSystem.shadows.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
    marginTop: spacing.sm,
  },
  headerName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerRole: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    gap: spacing.md,
    ...DesignSystem.shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    backgroundColor: colors.background.card,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.semantic.error,
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
  const initials = useMemo(() => {
    return (user?.name || 'User')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const fullName = useMemo(() => formatFullName(user?.name), [user?.name]);
  const purokLabel = user?.address || user?.purokName || 'Assigned Purok';
  const roleLabel = user?.role === 'admin' ? 'Municipal Admin' : 'Purok Leader';
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

  const handleProfileSettings = () => router.push('./profile-settings');
  const handleChangePin = () => router.push({ pathname: './profile-settings', params: { mode: 'pin' } });
  const handleNotifications = () => Alert.alert('Notifications', 'Notification preferences will be configurable soon.');
  const handleSupport = () => Alert.alert('Support', 'Please contact your Municipal Admin for assistance.');

  const ProfileRow = ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={20} color={colors.text.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.headerName}>{fullName}</Text>
          <Text style={styles.headerRole}>{purokLabel}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.semantic.success} />
            <Text style={{ color: colors.semantic.success, fontWeight: typography.fontWeight.semibold }}>
              {roleLabel}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Official Details</Text>
          <ProfileRow icon="briefcase-outline" label="Role" value={roleLabel} />
          <ProfileRow icon="id-card" label="Leader ID" value={String(user?.id ?? '—')} />
          <ProfileRow icon="location-outline" label="Location" value={purokLabel} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <ProfileRow icon="mail-outline" label="Email" value={user?.email || 'No email on record'} />
          <ProfileRow icon="call-outline" label="Phone" value={user?.phoneNumber || 'No phone on record'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={handleProfileSettings} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="person-circle-outline" size={22} color={colors.text.primary} />
              <Text style={styles.settingsLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={handleChangePin} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="key-outline" size={22} color={colors.text.primary} />
              <Text style={styles.settingsLabel}>Change PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={handleNotifications} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              <Text style={styles.settingsLabel}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={handleSupport} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="help-circle-outline" size={22} color={colors.text.primary} />
              <Text style={styles.settingsLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing['2xl'],
          alignItems: 'center',
          gap: spacing.lg,
        }}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.semantic.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>UrbanWatch Purok v1.0.0</Text>
        </View>
      </ScrollView>
      {isLoading && <LoadingSpinner />}
    </SafeAreaView>
  );
}


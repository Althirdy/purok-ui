/**
 * Custom Header Component with Profile Avatar
 * Matches uw-citizen header style
 */

import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { colors, spacing, typography } = DesignSystem;

export function CustomHeader() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleAvatarPress = () => {
    router.push('/(tabs)/profile' as any);
  };

  const profilePictureUri = user?.profilePicture;

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.appName}>UrbanWatch</Text>
          <Text style={styles.appSubtitle}>Purok Leader</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handleAvatarPress}
            activeOpacity={0.7}
          >
            {profilePictureUri ? (
              <Image source={{ uri: profilePictureUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={colors.text.inverse} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.blue,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.navy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

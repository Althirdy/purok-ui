import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

interface WelcomeBannerProps {
  pendingCount: number;
  acknowledgedCount: number;
}

export function WelcomeModal({ pendingCount, acknowledgedCount }: WelcomeBannerProps) {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    const name = (user?.name || '').trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 1 && parts[0]) return parts[0];
    return 'Purok Leader';
  }, [user]);

  return (
    <Animated.View
      entering={SlideInLeft.duration(300).springify()}
      style={styles.container}
    >
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="person-circle" size={40} color={colors.primary.blue} />
        </View>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome back, {displayName}!</Text>
          <Text style={styles.welcomeSubtext}>
            {pendingCount > 0
              ? `You have ${pendingCount} pending concern${pendingCount > 1 ? 's' : ''}`
              : acknowledgedCount > 0
                ? `${acknowledgedCount} concern${acknowledgedCount > 1 ? 's' : ''} in progress`
                : 'All concerns are resolved'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    marginRight: spacing.md,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: isTablet ? typography.fontSize.lg : typography.fontSize.base,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: isTablet ? typography.fontSize.sm : typography.fontSize.xs,
    color: colors.text.secondary,
  },
});

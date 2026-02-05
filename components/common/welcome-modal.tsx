/**
 * Welcome Banner - Dismissible welcome message above search
 */

import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutRight } from 'react-native-reanimated';

const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const WELCOME_DISMISSED_KEY = '@urbanwatch:welcome_dismissed';

interface WelcomeBannerProps {
  pendingCount: number;
  acknowledgedCount: number;
}

export function WelcomeModal({ pendingCount, acknowledgedCount }: WelcomeBannerProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Load dismissed state on mount
  useEffect(() => {
    const checkDismissedState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(WELCOME_DISMISSED_KEY);
        if (dismissed !== 'true') {
          setIsVisible(true);
        }
      } catch (error) {
        console.log('[WelcomeBanner] Error checking dismissed state:', error);
      }
    };
    checkDismissedState();
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle dismiss
  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
      console.log('[WelcomeBanner] Error saving dismissed state:', error);
    }
  };

  const displayName = useMemo(() => {
    const name = (user?.name || '').trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 1 && parts[0]) return parts[0];
    return 'Purok Leader';
  }, [user]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      entering={SlideInLeft.duration(300).springify()}
      exiting={SlideOutRight.duration(200)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

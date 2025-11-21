/**
 * Reusable Card Component
 */

import { DesignSystem } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

const { colors, spacing, borderRadius, shadows } = DesignSystem;

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', onPress, style }: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  
  elevated: {
    ...shadows.md,
  },
});


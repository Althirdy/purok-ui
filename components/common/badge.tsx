/**
 * Reusable Badge Component
 */

import { DesignSystem } from '@/constants/design-system';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

const { colors, typography, spacing, borderRadius } = DesignSystem;

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const badgeStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={badgeStyle}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  
  default: {
    backgroundColor: colors.accent.orange,
  },
  
  success: {
    backgroundColor: colors.semantic.success,
  },
  
  warning: {
    backgroundColor: colors.semantic.warning,
  },
  
  error: {
    backgroundColor: colors.semantic.error,
  },
  
  info: {
    backgroundColor: colors.semantic.info,
  },
  
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
});


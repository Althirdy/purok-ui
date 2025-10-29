/**
 * Reusable Button Component
 */

import { DesignSystem } from '@/constants/design-system';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_size_${size}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.primary : colors.accent.orange} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.accent.orange,
    ...shadows.sm,
  },
  
  secondary: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.neutral.gray600,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent.orange,
  },
  
  // Sizes
  size_small: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  
  size_medium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  
  size_large: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconContainer: {
    marginRight: spacing.sm,
  },
  
  // Text Styles
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  
  text_primary: {
    color: colors.text.inverse,
  },
  
  text_secondary: {
    color: colors.text.primary,
  },
  
  text_outline: {
    color: colors.accent.orange,
  },
  
  text_size_small: {
    fontSize: typography.fontSize.sm,
  },
  
  text_size_medium: {
    fontSize: typography.fontSize.base,
  },
  
  text_size_large: {
    fontSize: typography.fontSize.lg,
  },
});


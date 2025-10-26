/**
 * Reusable Header Component
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem } from '@/constants/design-system';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export function Header({ title, subtitle, leftIcon, rightIcon, onLeftPress, onRightPress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {leftIcon && onLeftPress && (
          <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
            <IconSymbol name={leftIcon as any} size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      <View style={styles.rightSection}>
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <IconSymbol name={rightIcon as any} size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.navy,
  },
  
  leftSection: {
    width: 40,
  },
  
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  
  rightSection: {
    width: 40,
  },
  
  iconButton: {
    padding: spacing.xs,
  },
  
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});


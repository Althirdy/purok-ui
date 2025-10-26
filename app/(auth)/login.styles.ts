/**
 * Login Screen Styles
 */

import { DesignSystem } from '@/constants/design-system';
import { StyleSheet } from 'react-native';

const { colors, typography, spacing, borderRadius } = DesignSystem;

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  logoContainer: {
    marginBottom: spacing.md,
  },
  
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.orange,
  },
  
  logoInner: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.orange,
  },
  
  logoText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.orange,
  },
  
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  
  pinSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  
  pinLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  
  pinDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  
  pinDot: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.neutral.gray600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  pinDotFilled: {
    borderColor: colors.accent.orange,
  },
  
  pinDotActive: {
    borderColor: colors.accent.orange,
    backgroundColor: `${colors.accent.orange}20`,
  },
  
  pinDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent.orange,
  },
  
  forgotPin: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.orange,
    marginTop: spacing.sm,
  },
  
  numberPad: {
    flex: 1,
    justifyContent: 'center',
  },
  
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  
  numberButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  numberText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  
  loginButton: {
    marginBottom: spacing.md,
  },
});


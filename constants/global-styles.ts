/**
 * Global Reusable Styles
 * Common style patterns used across the app
 */

import { StyleSheet } from 'react-native';
import { DesignSystem } from './design-system';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

export const globalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  
  // Card Styles (enhanced for modern UI)
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  
  cardLarge: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  
  // Text Styles
  textHeading1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
  },
  
  textHeading2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  },
  
  textHeading3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  
  textBody: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.primary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  
  textBodySecondary: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  
  textCaption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  
  textLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  
  // Button Base Styles
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  
  buttonPrimary: {
    backgroundColor: colors.accent.orange,
    height: 48,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  
  buttonPrimaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  
  buttonSecondary: {
    backgroundColor: colors.background.secondary,
    height: 48,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  
  buttonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  
  // Layout Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  // Spacing Utilities
  mt_xs: { marginTop: spacing.xs },
  mt_sm: { marginTop: spacing.sm },
  mt_md: { marginTop: spacing.md },
  mt_lg: { marginTop: spacing.lg },
  mt_xl: { marginTop: spacing.xl },
  
  mb_xs: { marginBottom: spacing.xs },
  mb_sm: { marginBottom: spacing.sm },
  mb_md: { marginBottom: spacing.md },
  mb_lg: { marginBottom: spacing.lg },
  mb_xl: { marginBottom: spacing.xl },
  
  ml_xs: { marginLeft: spacing.xs },
  ml_sm: { marginLeft: spacing.sm },
  ml_md: { marginLeft: spacing.md },
  ml_lg: { marginLeft: spacing.lg },
  ml_xl: { marginLeft: spacing.xl },
  
  mr_xs: { marginRight: spacing.xs },
  mr_sm: { marginRight: spacing.sm },
  mr_md: { marginRight: spacing.md },
  mr_lg: { marginRight: spacing.lg },
  mr_xl: { marginRight: spacing.xl },
  
  p_xs: { padding: spacing.xs },
  p_sm: { padding: spacing.sm },
  p_md: { padding: spacing.md },
  p_lg: { padding: spacing.lg },
  p_xl: { padding: spacing.xl },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  
  // Badge
  badge: {
    backgroundColor: colors.accent.orange,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});


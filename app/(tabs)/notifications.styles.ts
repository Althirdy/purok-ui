/**
 * Notifications Screen Styles
 */

import { DesignSystem } from '@/constants/design-system';
import { StyleSheet } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  markAllRead: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.orange,
  },
  
  unreadSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  
  unreadText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  
  notificationCard: {
    marginBottom: spacing.md,
  },
  
  notificationContent: {
    flexDirection: 'row',
  },
  
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  
  iconContainerUnread: {
    backgroundColor: `${colors.accent.orange}20`,
  },
  
  textContent: {
    flex: 1,
  },
  
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  
  notificationTitleUnread: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.orange,
    marginLeft: spacing.xs,
  },
  
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing.xs,
  },
  
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});


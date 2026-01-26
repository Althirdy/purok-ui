/**
 * Emergency Report Card Component
 */

import { Card } from '@/components/common/card';
import { DesignSystem, scale, moderateScale } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import {
  formatReportId,
  formatTimestamp,
  getCategory,
  getSeverityColor,
  getStatusColor,
  getStatusText,
} from '@/utils/reportHelpers';

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing, borderRadius } = DesignSystem;

export interface ReportCardProps {
  report: EmergencyReport;
  onPress?: (reportId: string) => void;
  onAcknowledge?: (reportId: string) => void;
  onResolve?: (reportId: string) => void;
  [key: string]: any;
}

function ReportCardComponent({ report, onPress, onAcknowledge, onResolve }: ReportCardProps) {


  const getCategoryIcon = (originalCategory?: string, type?: EmergencyReport['type']) => {
    // Use original category from citizen side if available (matches citizen side icons)
    if (originalCategory) {
      const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
        'safety': 'shield-outline',        // Matches citizen side
        'security': 'eye-outline',         // Matches citizen side
        'infrastructure': 'construct-outline', // Matches citizen side
        'environment': 'leaf-outline',       // Matches citizen side
        'noise': 'volume-high-outline',      // Matches citizen side
        'other': 'alert-circle-outline',     // Matches citizen side (was ellipsis)
        'voice_concern': 'mic-outline',
      };
      return categoryIcons[originalCategory.toLowerCase()] || 'alert-circle-outline';
    }

    // Fallback to type-based icons
    switch (type) {
      case 'accident':
        return 'car-outline';
      case 'crime':
        return 'eye-outline'; // Security icon
      case 'fire':
        return 'flame-outline';
      case 'medical':
        return 'medical-outline';
      case 'suspicious':
        return 'shield-outline'; // Safety icon
      default:
        return 'alert-circle-outline';
    }
  };

  const getCategoryIconColor = (originalCategory?: string) => {
    if (originalCategory) {
      const categoryColors: Record<string, string> = {
        'safety': '#f59e0b',      // Orange
        'security': '#ef4444',     // Red
        'infrastructure': '#3b82f6', // Blue
        'environment': '#10b981',   // Green
        'noise': '#8b5cf6',        // Purple
        'other': '#64748b',        // Gray
        'voice_concern': '#64748b', // Gray
      };
      return categoryColors[originalCategory.toLowerCase()] || colors.accent.orange;
    }
    return colors.accent.orange;
  };

  const getSeverityBadge = (severity: string) => {
    const badgeColor = getSeverityColor(severity as EmergencyReport['severity']);
    return (
      <View style={[styles.severityBadge, { backgroundColor: badgeColor + '20' }]}>
        <Text style={[styles.severityBadgeText, { color: badgeColor }]}>
          {severity.toUpperCase()}
        </Text>
      </View>
    );
  };


  // All cards are clickable if onPress is provided, regardless of status
  const canOpenDetails = !!onPress;
  const statusBadgeStyle = getStatusColor(report.status);

  return (
    <Card onPress={canOpenDetails ? () => onPress!(report.id) : undefined} variant="default" style={styles.card}>
      {/* ID Badge and Aggregation Badge - Top Right */}
      <View style={styles.topRow}>
        {report.relatedReportsCount && report.relatedReportsCount > 0 ? (
          <View style={styles.aggregationBadge}>
            <Ionicons name="people" size={12} color={colors.primary.blue} style={{ marginRight: 4 }} />
            <Text style={styles.aggregationText}>
              {report.relatedReportsCount + 1} Reports
            </Text>
          </View>
        ) : null}
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{formatReportId(report.id)}</Text>
        </View>
      </View>

      {/* Header: Icon, Title, Category, Severity */}
      <View style={styles.header}>
        {/* Icon on Left */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(report.originalCategory, report.type)}
            size={24}
            color={getCategoryIconColor(report.originalCategory)}
          />
        </View>

        {/* Content */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{report.title}</Text>
          <Text style={styles.category}>{getCategory(report.type, report.originalCategory)}</Text>
        </View>

        {/* Severity Badge on Right */}
        <View style={styles.meta}>
          {getSeverityBadge(report.severity)}
        </View>
      </View>

      {/* Description - Indented */}
      {report.description && (
        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>
      )}

      {/* Location - Indented */}
      <Text style={styles.location}>{report.location}</Text>

      {/* Footer: Timestamp and Status - Indented */}
      <View style={styles.footer}>
        <View style={styles.timestampRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.timestampText}>{formatTimestamp(report.timestamp)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusBadgeStyle.borderColor }]}>
            {getStatusText(report.status)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {report.status === 'pending' && (onPress || onAcknowledge) && (
        <View style={styles.actionsContainer}>
          {onPress && (
            <TouchableOpacity
              style={[styles.seeMoreButton, { height: scale(48) }]}
              onPress={(e) => {
                e.stopPropagation();
                onPress(report.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.seeMoreText, { fontSize: typography.fontSize.base }]}>See More</Text>
            </TouchableOpacity>
          )}
          {onAcknowledge && (
            <TouchableOpacity
              style={[styles.acknowledgeButton, { height: scale(48) }]}
              onPress={(e) => {
                e.stopPropagation();
                onAcknowledge(report.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.acknowledgeText, { fontSize: typography.fontSize.base }]}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Resolve Button (shown after acknowledging) */}
      {report.status === 'acknowledged' && onResolve && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.resolveButton, { height: scale(48) }]}
            onPress={(e) => {
              e.stopPropagation();
              onResolve(report.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-circle" size={scale(20)} color={colors.text.inverse} style={{ marginRight: spacing.xs }} />
            <Text style={[styles.resolveText, { fontSize: typography.fontSize.base }]}>Mark as Resolved</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>

  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if report data actually changed (not function references)
// Optimized memo comparison - only re-render if report data or callbacks change
export const ReportCard = React.memo(ReportCardComponent, (prevProps, nextProps) => {
  // Compare report by ID and key fields that affect rendering
  if (prevProps.report.id !== nextProps.report.id) return false;
  if (prevProps.report.status !== nextProps.report.status) return false;
  if (prevProps.report.title !== nextProps.report.title) return false;
  if (prevProps.report.severity !== nextProps.report.severity) return false;
  if (prevProps.report.relatedReportsCount !== nextProps.report.relatedReportsCount) return false;
  if (prevProps.report.timestamp.getTime() !== nextProps.report.timestamp.getTime()) return false;

  // Compare callbacks by reference (they should be stable with useCallback)
  // Handle undefined callbacks properly
  if (!!prevProps.onPress !== !!nextProps.onPress) return false;
  if (prevProps.onPress && prevProps.onPress !== nextProps.onPress) return false;
  if (!!prevProps.onAcknowledge !== !!nextProps.onAcknowledge) return false;
  if (prevProps.onAcknowledge && prevProps.onAcknowledge !== nextProps.onAcknowledge) return false;
  if (!!prevProps.onResolve !== !!nextProps.onResolve) return false;
  if (prevProps.onResolve && prevProps.onResolve !== nextProps.onResolve) return false;

  // Props are equal, skip re-render
  return true;
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  aggregationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff', // Light blue
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },

  aggregationText: {
    fontSize: typography.fontSize.xs,
    color: '#1e40af', // Dark blue
    fontWeight: '700',
  },

  idBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: moderateScale(4),
  },

  idText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.light,
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    backgroundColor: colors.background.secondary,
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  category: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  meta: {
    alignItems: 'flex-end',
  },

  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: moderateScale(60),
    alignItems: 'center',
  },

  severityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing.md,
    marginLeft: moderateScale(64),
  },

  location: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginLeft: moderateScale(64),
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: moderateScale(64),
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  timestampText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },

  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  seeMoreButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.dark,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },

  seeMoreText: {
    fontWeight: '600',
    color: colors.text.primary,
  },

  acknowledgeButton: {
    flex: 1,
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },

  acknowledgeText: {
    fontWeight: '600',
    color: colors.text.inverse,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: colors.semantic.success,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resolveText: {
    fontWeight: '600',
    color: colors.text.inverse,
  },
});


/**
 * Emergency Report Card Component
 */

import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
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

const { colors, typography, spacing } = DesignSystem;

export interface ReportCardProps {
  report: EmergencyReport;
  onPress?: (reportId: string) => void;
  onAcknowledge?: (reportId: string) => void;
  [key: string]: any;
}

function ReportCardComponent({ report, onPress, onAcknowledge }: ReportCardProps) {
  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'cctv':
        return 'videocam';
      case 'sensor':
        return 'hardware-chip';
      case 'citizen':
        return 'people';
      default:
        return 'information-circle';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badgeColor = getSeverityColor(severity as EmergencyReport['severity']);
    return (
      <View style={[styles.severityBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.severityBadgeText}>{severity.toUpperCase()}</Text>
      </View>
    );
  };


  const canOpenDetails = !!onPress && report.status === 'pending';
  const statusBadgeStyle = getStatusColor(report.status);

  return (
    <Card onPress={canOpenDetails ? () => onPress!(report.id) : undefined} variant="elevated" style={styles.card}>
      {/* ID Badge - Top Right */}
      <View style={styles.idBadge}>
        <Text style={styles.idText}>{formatReportId(report.id)}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentRow}>
        {/* Icon on Left */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-outline" size={20} color={colors.accent.orange} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Severity Row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{report.title}</Text>
            {getSeverityBadge(report.severity)}
          </View>

          {/* Category */}
          <Text style={styles.category}>{getCategory(report.type)}</Text>

          {/* Location */}
          <Text style={styles.location}>{report.location}</Text>

          {/* Footer with timestamp and status */}
          <View style={styles.footerRow}>
            <View style={styles.timestampRow}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.timestampText}>{formatTimestamp(report.timestamp)}</Text>
            </View>
            <View style={[styles.statusBadge, statusBadgeStyle]}>
              <Text style={[styles.statusText, { color: statusBadgeStyle.borderColor }]}>
                {getStatusText(report.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description (if needed, can be hidden or shown) */}
      {report.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {report.description}
          </Text>
        </View>
      )}


      {report.status === 'pending' && onPress && (
        <TouchableOpacity 
          style={styles.seeMoreButton}
          onPress={(e) => {
            e.stopPropagation();
            onPress(report.id);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.seeMoreText}>See More</Text>
        </TouchableOpacity>
      )}

      {report.status === 'pending' && onAcknowledge && (
        <TouchableOpacity 
          style={styles.acknowledgeButton} 
          onPress={(e) => {
            e.stopPropagation();
            onAcknowledge(report.id);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.acknowledgeText}>Acknowledge</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if report data actually changed (not function references)
export const ReportCard: React.MemoExoticComponent<React.NamedExoticComponent<ReportCardProps>> = React.memo(ReportCardComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  // Only check report properties, not function references (functions are stable in useCallback)
  if (prevProps.report.id !== nextProps.report.id) return false;
  if (prevProps.report.status !== nextProps.report.status) return false;
  if (prevProps.report.title !== nextProps.report.title) return false;
  if (prevProps.report.description !== nextProps.report.description) return false;
  if (prevProps.report.severity !== nextProps.report.severity) return false;
  if (prevProps.report.timestamp.getTime() !== nextProps.report.timestamp.getTime()) return false;
  // onAcknowledge might be undefined, so handle that case
  if (!!prevProps.onAcknowledge !== !!nextProps.onAcknowledge) return false;
  if (!!prevProps.onPress !== !!nextProps.onPress) return false;
  
  return true; // Props are equal, skip re-render
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    position: 'relative',
    padding: spacing.md,
  },
  
  idBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  
  idText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    fontFamily: 'monospace',
  },
  
  contentRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    marginRight: 80, // Space for ID badge
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
  
  content: {
    flex: 1,
  },
  
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  
  severityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  category: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  timestampText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  descriptionContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },

  
  acknowledgeButton: {
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  
  acknowledgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  
  statusBadge: {
    backgroundColor: colors.semantic.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },

  seeMoreButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.text.secondary,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  seeMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },

  // When acknowledged, we visually attach the green button to See More
  seeMoreTopOnlyRadius: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  acknowledgedButton: {
    backgroundColor: colors.semantic.success,
    paddingVertical: spacing.sm,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
  },

  acknowledgedTextAlt: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
});


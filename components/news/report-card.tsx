/**
 * Emergency Report Card Component
 */

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
  onResolve?: (reportId: string) => void;
  [key: string]: any;
}

function ReportCardComponent({ report, onPress, onAcknowledge, onResolve }: ReportCardProps) {
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

  // Get category badge colors (background + text)
  const getCategoryBadgeColors = (originalCategory?: string) => {
    const categoryStyles: Record<string, { bg: string; text: string }> = {
      'safety': { bg: '#fef3c7', text: '#b45309' },        // Amber tones
      'security': { bg: '#fee2e2', text: '#b91c1c' },      // Red tones
      'infrastructure': { bg: '#dbeafe', text: '#1d4ed8' }, // Blue tones
      'environment': { bg: '#d1fae5', text: '#047857' },    // Green tones
      'noise': { bg: '#ede9fe', text: '#6d28d9' },          // Purple tones
      'other': { bg: '#f1f5f9', text: '#475569' },          // Gray tones
      'voice_concern': { bg: '#f1f5f9', text: '#475569' },  // Gray tones
    };
    const key = originalCategory?.toLowerCase() || 'other';
    return categoryStyles[key] || categoryStyles['other'];
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
  const categoryColor = getCategoryIconColor(report.originalCategory);

  return (
    <Card onPress={canOpenDetails ? () => onPress!(report.id) : undefined} variant="default" style={styles.card}>
      {/* ID Badge - Top Right */}
      <View style={styles.topRow}>
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
          {/* Category text with color */}
          <Text style={[styles.category, { color: categoryColor }]}>
            {getCategory(report.type, report.originalCategory)}
          </Text>
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

      {/* Footer Row 1: Timestamp and Status */}
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

      {/* Follow-up Activity Banner - shown separately when there are related reports */}
      {report.relatedReportsCount !== undefined && report.relatedReportsCount > 0 && (
        <View style={styles.followUpBanner}>
          <View style={styles.followUpIconContainer}>
            <Ionicons name="git-merge-outline" size={16} color="#1e40af" />
          </View>
          <Text style={styles.followUpBannerText}>
            <Text style={styles.followUpCount}>{report.relatedReportsCount}</Text>
            {' '}related concern{report.relatedReportsCount > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </View>
      )}

      {/* Action Buttons */}
      {report.status === 'pending' && (onPress || onAcknowledge) && (
        <View style={styles.actionsContainer}>
          {onPress && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={(e) => {
                e.stopPropagation();
                onPress(report.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          )}
          {onAcknowledge && (
            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={(e) => {
                e.stopPropagation();
                onAcknowledge(report.id);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.acknowledgeText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Resolve Button (shown after acknowledging) */}
      {report.status === 'acknowledged' && onResolve && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={(e) => {
              e.stopPropagation();
              onResolve(report.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-circle" size={18} color={colors.text.inverse} style={{ marginRight: 6 }} />
            <Text style={styles.resolveText}>Mark as Resolved</Text>
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
  if (prevProps.report.timestamp.getTime() !== nextProps.report.timestamp.getTime()) return false;
  // Compare related reports count (new field)
  if (prevProps.report.relatedReportsCount !== nextProps.report.relatedReportsCount) return false;

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

// Layout aligned with uw-citizen ConcernCard: padding 16, marginBottom 8, icon 40x40, content marginLeft 52
const styles = StyleSheet.create({
  card: {
    padding: spacing.md, // 16px - same as citizen ConcernCard Spacing.lg
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border?.default ?? '#e2e8f0',
    backgroundColor: colors.background?.card ?? '#ffffff',
    borderRadius: 16,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },

  idBadge: {
    backgroundColor: colors.background?.secondary ?? '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  idText: {
    fontSize: 12,
    color: colors.text?.secondary ?? '#94a3b8',
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background?.secondary ?? '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: 18, // Same as citizen (was 16)
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },

  category: {
    fontSize: 14,
    fontWeight: '600',
  },

  meta: {
    alignItems: 'flex-end',
  },

  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },

  severityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  description: {
    fontSize: 15, // Same as citizen (was 14)
    color: '#475569',
    lineHeight: 24, // Same as citizen (was 20)
    marginBottom: 12,
    marginLeft: 52, // Same as citizen (was 64) - icon 40px + margin 12px
  },

  location: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    marginLeft: 52, // Same as citizen (was 64)
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 52, // Same as citizen (was 64)
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Same as citizen (was 4)
  },

  timestampText: {
    fontSize: 13, // Same as citizen (was 12)
    color: '#64748b',
  },

  // Follow-up Banner - Full width, below footer
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: 52,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff', // sky-50
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0f2fe', // sky-100
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7', // sky-600
  },

  followUpIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe', // blue-100
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  followUpBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#475569', // slate-600
  },

  followUpCount: {
    fontWeight: '700',
    color: '#1e40af', // blue-800
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  seeMoreButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },

  acknowledgeButton: {
    flex: 1,
    backgroundColor: colors.primary.blue,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  acknowledgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: colors.semantic.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resolveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});


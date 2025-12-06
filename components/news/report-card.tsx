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
          <Ionicons name="shield-outline" size={24} color={colors.accent.orange} />
        </View>

        {/* Content */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{report.title}</Text>
          <Text style={styles.category}>{getCategory(report.type)}</Text>
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
export const ReportCard: React.MemoExoticComponent<React.NamedExoticComponent<ReportCardProps>> = React.memo(ReportCardComponent, (prevProps, nextProps) => {
  // Compare report by ID and key fields that affect rendering
  if (prevProps.report.id !== nextProps.report.id) return false;
  if (prevProps.report.status !== nextProps.report.status) return false;
  if (prevProps.report.title !== nextProps.report.title) return false;
  if (prevProps.report.severity !== nextProps.report.severity) return false;
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
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  
  idBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  idText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  info: {
    flex: 1,
  },
  
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  category: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
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
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 64,
  },
  
  location: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    marginLeft: 64,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 64,
  },
  
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  timestampText: {
    fontSize: 12,
    color: '#64748b',
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


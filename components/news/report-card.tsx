/**
 * Emergency Report Card Component
 */

import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface ReportCardProps {
  report: EmergencyReport;
  onPress: (reportId: string) => void;
  onAcknowledge?: (reportId: string) => void;
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

  const getCategory = (type: string) => {
    switch (type) {
      case 'accident':
        return 'Road Accident';
      case 'crime':
        return 'Crime';
      case 'fire':
        return 'Fire';
      case 'medical':
        return 'Medical Emergency';
      case 'suspicious':
        return 'Suspicious Activity';
      case 'other':
        return 'Flood';
      default:
        return 'Other';
    }
  };

  const getSeverityBadge = (severity: string) => {
    // Use unified blue styling for all severities per design request
    const baseStyle = { backgroundColor: colors.primary.blue } as const;
    switch (severity) {
      case 'critical':
        return <Badge label="CRITICAL" style={baseStyle} />;
      case 'high':
        return <Badge label="HIGH" style={baseStyle} />;
      case 'medium':
        return <Badge label="MEDIUM" style={baseStyle} />;
      case 'low':
        return <Badge label="LOW" style={baseStyle} />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diff = now.getTime() - reportDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    
    // Format date: MM/DD/YYYY
    const month = reportDate.getMonth() + 1;
    const day = reportDate.getDate();
    const year = reportDate.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getStatusBadge = () => {
    if (report.status === 'acknowledged') {
      return (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Acknowledged</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Card onPress={() => onPress(report.id)} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{report.title}</Text>
        {getSeverityBadge(report.severity)}
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText} numberOfLines={4}>
          {report.description}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.detailsText}>
          {report.location} • {formatTimestamp(report.timestamp)}
        </Text>
      </View>


      {/* See More button (always visible) */}
      <TouchableOpacity 
        style={[
          styles.seeMoreButton,
          report.status === 'acknowledged' && styles.seeMoreTopOnlyRadius,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onPress(report.id);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.seeMoreText}>See More</Text>
      </TouchableOpacity>

      {report.status === 'pending' && onAcknowledge && (
        <TouchableOpacity 
          style={styles.acknowledgeButton} 
          onPress={(e) => {
            e.stopPropagation();
            onAcknowledge(report.id);
          }}
        >
          <Text style={styles.acknowledgeText}>Acknowledge</Text>
        </TouchableOpacity>
      )}

      {report.status === 'acknowledged' && (
        <View>
          <View style={styles.acknowledgedButton}>
            <Text style={styles.acknowledgedTextAlt}>Acknowledged</Text>
          </View>
        </View>
      )}
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if report data actually changed (not function references)
export const ReportCard = React.memo(ReportCardComponent, (prevProps, nextProps) => {
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
  
  return true; // Props are equal, skip re-render
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  acknowledgedBadge: {
    backgroundColor: colors.semantic.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  
  acknowledgedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a8a20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  sourceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  
  idText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },

  descriptionContainer: {
    marginBottom: spacing.md,
  },

  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  
  body: {
    marginBottom: spacing.sm,
  },
  
  footer: {
    marginBottom: spacing.xs,
  },
  
  detailsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },

  
  acknowledgeButton: {
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
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
    borderRadius: 8,
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


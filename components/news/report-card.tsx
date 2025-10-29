/**
 * Emergency Report Card Component
 */

import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface ReportCardProps {
  report: EmergencyReport;
  onPress: () => void;
  onAcknowledge?: () => void;
}

export function ReportCard({ report, onPress, onAcknowledge }: ReportCardProps) {
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
    switch (severity) {
      case 'critical':
        return <Badge label="CRITICAL" variant="error" />;
      case 'high':
        return <Badge label="HIGH" variant="warning" />;
      case 'medium':
        return <Badge label="MEDIUM" variant="info" />;
      case 'low':
        return <Badge label="LOW" variant="success" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
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
    <Card onPress={onPress} variant="elevated" style={styles.card}>
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

      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>Category: {getCategory(report.type)}</Text>
      </View>

      {/* See More button (always visible) */}
      <TouchableOpacity 
        style={[
          styles.seeMoreButton,
          report.status === 'acknowledged' && styles.seeMoreTopOnlyRadius,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onPress();
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
            onAcknowledge();
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
    backgroundColor: `${colors.accent.orange}20`,
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

  categoryContainer: {
    marginBottom: spacing.sm,
  },

  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  
  acknowledgeButton: {
    backgroundColor: colors.accent.orange,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  
  acknowledgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
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


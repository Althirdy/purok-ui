/**
 * Emergency Report Card Component
 */

import { Badge } from '@/components/common/badge';
import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import { Ionicons } from '@expo/vector-icons';
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
      case 'sensor_box':
        return 'hardware-chip';
      case 'citizen_reports':
        return 'people';
      default:
        return 'information-circle';
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

  return (
    <Card onPress={onPress} variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getSourceIcon(report.source) as any} 
              size={20} 
              color={colors.accent.orange} 
            />
          </View>
          <View>
            <Text style={styles.sourceText}>{report.source?.toUpperCase() || 'REPORT'}</Text>
            <Text style={styles.idText}>ID: {report.id.substring(0, 8)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {getSeverityBadge(report.severity)}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color={colors.text.secondary} />
          <Text style={styles.locationText}>{report.location}</Text>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(report.timestamp)}</Text>
      </View>

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
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Acknowledged</Text>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  headerRight: {
    marginLeft: spacing.sm,
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
  
  body: {
    marginBottom: spacing.sm,
  },
  
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray600,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
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
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
});


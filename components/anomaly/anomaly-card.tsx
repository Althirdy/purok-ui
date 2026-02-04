/**
 * Anomaly Card Component - Displays IoT anomaly logs
 * Styled to match ReportCard from citizen concerns
 */

import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import type { AnomalyLog, AnomalyType } from '@/types/anomaly';
import { getIoTBoxDisplayName, getIoTBoxLocation, getLocationDisplay } from '@/types/anomaly';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

export interface AnomalyCardProps {
  anomaly: AnomalyLog;
  onPress?: (id: number) => void;
}

// Get icon for anomaly type
function getAnomalyIcon(type: AnomalyType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'sound_anomaly':
      return 'volume-high-outline';
    case 'anti_tampering':
      return 'warning-outline';
    default:
      return 'alert-circle-outline';
  }
}

// Get color for anomaly type
function getAnomalyColor(type: AnomalyType): string {
  switch (type) {
    case 'sound_anomaly':
      return '#8b5cf6'; // Purple
    case 'anti_tampering':
      return '#ef4444'; // Red
    default:
      return '#64748b'; // Gray
  }
}

// Get badge colors for anomaly type
function getAnomalyBadgeColors(type: AnomalyType): { bg: string; text: string } {
  switch (type) {
    case 'sound_anomaly':
      return { bg: '#ede9fe', text: '#6d28d9' };  // Purple tones
    case 'anti_tampering':
      return { bg: '#fee2e2', text: '#b91c1c' };  // Red tones
    default:
      return { bg: '#f1f5f9', text: '#475569' };  // Gray tones
  }
}

// Format timestamp
function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function AnomalyCardComponent({ anomaly, onPress }: AnomalyCardProps) {
  const iconColor = getAnomalyColor(anomaly.anomaly_type);
  const badgeColors = getAnomalyBadgeColors(anomaly.anomaly_type);
  const isPending = !anomaly.is_confirmed;
  const locationDisplay = getLocationDisplay(anomaly.location) || getIoTBoxLocation(anomaly.iot_box);

  return (
    <Card 
      onPress={onPress ? () => onPress(anomaly.id) : undefined} 
      variant="default" 
      style={styles.card}
    >
      {/* Top Row: Type Badge + ID Badge */}
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: badgeColors.bg }]}>
          <Text style={[styles.typeBadgeText, { color: badgeColors.text }]}>
            IoT Anomaly
          </Text>
        </View>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>#{anomaly.id}</Text>
        </View>
      </View>

      {/* Header: Icon, Title, Status */}
      <View style={styles.header}>
        {/* Icon on Left */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={getAnomalyIcon(anomaly.anomaly_type)} size={24} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{anomaly.anomaly_type_label}</Text>
          <Text style={[styles.category, { color: iconColor }]}>
            {getIoTBoxDisplayName(anomaly.iot_box)}
          </Text>
        </View>

        {/* Status Badge on Right */}
        <View style={[styles.statusBadge, { backgroundColor: isPending ? '#fef3c7' : '#d1fae5' }]}>
          <Text style={[styles.statusText, { color: isPending ? '#b45309' : '#047857' }]}>
            {isPending ? 'Pending' : 'Confirmed'}
          </Text>
        </View>
      </View>

      {/* Location - Indented */}
      {locationDisplay && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.location} numberOfLines={1}>{locationDisplay}</Text>
        </View>
      )}

      {/* Footer Row: Timestamp */}
      <View style={styles.footer}>
        <View style={styles.timestampRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.timestampText}>{formatTimestamp(anomaly.created_at)}</Text>
        </View>
      </View>

      {/* Related Anomalies Banner - shown when there are grouped anomalies */}
      {anomaly.related_anomalies_count !== undefined && anomaly.related_anomalies_count > 0 && (
        <View style={styles.relatedBanner}>
          <View style={styles.relatedIconContainer}>
            <Ionicons name="git-merge-outline" size={16} color="#7c3aed" />
          </View>
          <Text style={styles.relatedBannerText}>
            <Text style={styles.relatedCount}>{anomaly.related_anomalies_count}</Text>
            {' '}related anomal{anomaly.related_anomalies_count > 1 ? 'ies' : 'y'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </View>
      )}
    </Card>
  );
}

// Layout aligned with ReportCard styling
const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border?.default ?? '#e2e8f0',
    backgroundColor: colors.background?.card ?? '#ffffff',
    borderRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 52, // Align with content after icon
    marginBottom: 8,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: colors.text?.secondary ?? '#64748b',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 52, // Align with content after icon
    marginTop: 4,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 13,
    color: colors.text?.secondary ?? '#94a3b8',
    fontWeight: '500',
  },
  // Related anomalies banner styles (matches report-card followUpBanner)
  relatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    gap: 8,
  },
  relatedIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  relatedCount: {
    fontWeight: '700',
    color: '#7c3aed',
  },
});

export const AnomalyCard = React.memo(AnomalyCardComponent);

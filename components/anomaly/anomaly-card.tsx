/**
 * Anomaly Card Component - Displays IoT anomaly logs
 */

import { Card } from '@/components/common/card';
import { DesignSystem } from '@/constants/design-system';
import type { AnomalyLog, AnomalyType } from '@/types/anomaly';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

export interface AnomalyCardProps {
  anomaly: AnomalyLog;
  onPress?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onDismiss?: (id: number) => void;
}

// Get icon for anomaly type
function getAnomalyIcon(type: AnomalyType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'sound_anomaly':
      return 'volume-high-outline';
    case 'anti_tampering':
      return 'warning-outline';
    case 'crowded':
      return 'people-outline';
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
    case 'crowded':
      return '#f59e0b'; // Orange
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
    case 'crowded':
      return { bg: '#fef3c7', text: '#b45309' };  // Amber tones
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

function AnomalyCardComponent({ anomaly, onPress, onConfirm, onDismiss }: AnomalyCardProps) {
  const iconColor = getAnomalyColor(anomaly.anomaly_type);
  const badgeColors = getAnomalyBadgeColors(anomaly.anomaly_type);
  const isPending = !anomaly.is_confirmed;

  return (
    <Card 
      onPress={onPress ? () => onPress(anomaly.id) : undefined} 
      variant="default" 
      style={styles.card}
    >
      {/* Status indicator strip */}
      <View 
        style={[
          styles.statusStrip, 
          { backgroundColor: isPending ? '#f59e0b' : '#10b981' }
        ]} 
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Header: Icon + Type + ID */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons 
              name={getAnomalyIcon(anomaly.anomaly_type)} 
              size={22} 
              color={iconColor} 
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>{anomaly.anomaly_type_label}</Text>
            <Text style={styles.idText}>ID: {anomaly.id}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: isPending ? '#fef3c7' : '#d1fae5' }]}>
            <Text style={[styles.statusText, { color: isPending ? '#b45309' : '#047857' }]}>
              {isPending ? 'Pending' : 'Confirmed'}
            </Text>
          </View>
        </View>

        {/* IoT Box Info */}
        {anomaly.iot_box && (
          <View style={styles.infoRow}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{anomaly.iot_box.name}</Text>
          </View>
        )}

        {/* Location */}
        {(anomaly.location || anomaly.iot_box?.location) && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {anomaly.location || anomaly.iot_box?.location}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText}>{formatTimestamp(anomaly.created_at)}</Text>
        </View>

        {/* Action buttons for pending anomalies */}
        {isPending && (onConfirm || onDismiss) && (
          <View style={styles.actions}>
            {onDismiss && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.dismissButton]}
                onPress={() => onDismiss(anomaly.id)}
              >
                <Ionicons name="close-outline" size={18} color="#64748b" />
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            )}
            {onConfirm && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => onConfirm(anomaly.id)}
              >
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statusStrip: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  idText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  dismissButton: {
    backgroundColor: '#f1f5f9',
  },
  dismissButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#fff',
  },
});

export const AnomalyCard = React.memo(AnomalyCardComponent);

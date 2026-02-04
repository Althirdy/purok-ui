/**
 * Anomaly Statistics Card - Dashboard widget for anomaly statistics
 */

import { DesignSystem } from '@/constants/design-system';
import type { AnomalyStatistics } from '@/types/anomaly';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface AnomalyStatisticsCardProps {
  statistics: AnomalyStatistics | null;
  loading?: boolean;
}

export function AnomalyStatisticsCard({ statistics, loading }: AnomalyStatisticsCardProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.text.primary} />
          <Text style={styles.headerTitle}>IoT Anomalies</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="hardware-chip-outline" size={20} color={colors.text.primary} />
        <Text style={styles.headerTitle}>IoT Anomalies</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{statistics.total.today} today</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatItem
          icon="volume-high-outline"
          label="Sound"
          value={statistics.today_by_type.sound_anomaly}
          color="#8b5cf6"
        />
        <StatItem
          icon="warning-outline"
          label="Tampering"
          value={statistics.today_by_type.anti_tampering}
          color="#ef4444"
        />
        <StatItem
          icon="alert-circle-outline"
          label="Pending"
          value={statistics.by_status.pending}
          color="#3b82f6"
        />
      </View>

      {/* Devices Status */}
      <View style={styles.devicesRow}>
        <View style={styles.deviceStat}>
          <View style={[styles.deviceDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.deviceText}>
            {statistics.devices.online} online
          </Text>
        </View>
        <View style={styles.deviceStat}>
          <View style={[styles.deviceDot, { backgroundColor: '#64748b' }]} />
          <Text style={styles.deviceText}>
            {statistics.devices.total - statistics.devices.online} offline
          </Text>
        </View>
        <Text style={styles.deviceTotal}>
          {statistics.devices.total} devices
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: colors.semantic.info + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.semantic.info,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  devicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  deviceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  deviceTotal: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: 'auto',
  },
});

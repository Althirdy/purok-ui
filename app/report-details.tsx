/**
 * Report Details Screen - Comprehensive view for a single report
 */

import { safeGet } from '@/lib/axios';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import type { EmergencyReport } from '@/types';
import { formatTimestampDetailed } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, spacing, typography } = DesignSystem;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.primary.blue,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...DesignSystem.shadows.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  value: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.orange,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  pillText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },
});

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams();
  const reportId = String(params.reportId || '');

  // API-ready fetch with graceful mock fallback
  const [report, setReport] = React.useState<EmergencyReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await safeGet<EmergencyReport>(`/reports/${reportId}`, () => ({
          id: reportId || 'UW-2025-001',
          type: 'suspicious',
          title: 'Suspicious Activity',
          description:
            "There's a person suddenly collapsed on the road of Barangay 176, Near Metroplaza. With a heat index of 38°C, it is suspected to be a Heat Stroke. Immediate Medical Response is needed.",
          location: 'Barangay 176, Near Metroplaza',
          timestamp: new Date(),
          status: 'pending',
          severity: 'high',
          source: 'cctv',
        }));
        setReport(data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportId]);


  const handleAcknowledge = () => {
    setReport(prev => (prev ? { ...prev, status: 'acknowledged' } : prev));
  };

  const handleResolve = () => {
    setReport(prev => (prev ? { ...prev, status: 'resolved' } : prev));
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Report</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {!report || loading ? (
          <View style={[styles.sectionCard, { marginTop: spacing.lg }]}>
            <Text style={{ color: colors.text.secondary }}>Loading...</Text>
          </View>
        ) : (
        <>
        <View style={[styles.sectionCard, { marginTop: spacing.lg }]}> 
          <View style={[styles.rowBetween, { marginBottom: spacing.sm }]}>
            <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }} numberOfLines={2}>{report.title}</Text>
            <View style={styles.pill}><Text style={styles.pillText}>{report.severity.toUpperCase()}</Text></View>
          </View>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{report.location}</Text>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{formatTimestampDetailed(report.timestamp)}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>{report.description}</Text>
        </View>

        <View style={[styles.sectionCard, { gap: spacing.sm }]}>
          {report.status === 'pending' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleAcknowledge}
              style={{ backgroundColor: colors.primary.blue, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', ...DesignSystem.shadows.sm }}
            >
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {report.status === 'acknowledged' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleResolve}
              style={{ backgroundColor: colors.semantic.success, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', ...DesignSystem.shadows.sm }}
            >
              <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>Resolve</Text>
            </TouchableOpacity>
          )}
          {report.status === 'resolved' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.text.secondary }}>Report resolved</Text>
            </View>
          )}
        </View>

        {/* Clean details only; evidence and internal identifiers hidden */}
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}



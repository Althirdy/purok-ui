/**
 * Report Details Screen - Comprehensive view for a single report
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { formatTimestampDetailed } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, spacing, typography } = DesignSystem;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.blue,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
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

  // Get reports from feed hook
  const { reports, updateReportStatus } = useReportsFeed();
  const [report, setReport] = React.useState<EmergencyReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Find report from feed
    const foundReport = reports.find(r => r.id === reportId);
    if (foundReport) {
      setReport(foundReport);
      setLoading(false);
    } else if (reports.length > 0) {
      // If reports are loaded but this one isn't found, it might not exist
      setLoading(false);
    }
  }, [reports, reportId]);


  const handleAcknowledge = () => {
    if (report) {
      updateReportStatus(report.id, 'acknowledged');
      setReport(prev => (prev ? { ...prev, status: 'acknowledged' } : prev));
    }
  };

  const handleResolve = () => {
    if (report) {
      updateReportStatus(report.id, 'resolved');
      setReport(prev => (prev ? { ...prev, status: 'resolved' } : prev));
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Report</Text>
        <View style={styles.headerSpacer} />
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
          <Text style={styles.value}>{formatDateReadable(report.timestamp)} {formatTime12Hour(report.timestamp)}</Text>
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
              style={{ backgroundColor: colors.primary.blue, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {report.status === 'acknowledged' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleResolve}
              style={{ backgroundColor: colors.semantic.success, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' }}
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



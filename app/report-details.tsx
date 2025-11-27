/**
 * Report Details Screen - Comprehensive view for a single report
 */

import { safeGet } from '@/api/axios';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/contexts/auth-context';
import { fetchAssignedConcernDetail, updateAssignedConcernStatus } from '@/services/purok-leader-service';
import type { EmergencyReport } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const { accessToken } = useAuth();
  const concernId = React.useMemo(
    () => (reportId.startsWith('PUROK-') ? reportId.replace('PUROK-', '') : null),
    [reportId],
  );

  // API-ready fetch with graceful mock fallback
  const [report, setReport] = React.useState<EmergencyReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statusUpdating, setStatusUpdating] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (concernId) {
          if (!accessToken) {
            throw new Error('Missing authentication token for citizen concern.');
          }
          const data = await fetchAssignedConcernDetail(accessToken, concernId);
          setReport(data);
        } else {
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
        }
      } catch (error: any) {
        const message = error?.message ?? 'Unable to load report.';
        Alert.alert('Error', message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportId, concernId, accessToken]);

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    try {
      return date.toLocaleString();
    } catch {
      return '';
    }
  };

  const updateStatus = async (status: 'ongoing' | 'resolved') => {
    if (concernId) {
      if (!accessToken) {
        Alert.alert('Cannot update status', 'Missing authentication token.');
        return;
      }
      try {
        setStatusUpdating(true);
        await updateAssignedConcernStatus(accessToken, concernId, status);
        setReport(prev => (prev ? { ...prev, status } : prev));
      } catch (error: any) {
        const message = error?.message ?? 'Please try again.';
        Alert.alert('Failed to update status', message);
      } finally {
        setStatusUpdating(false);
      }
      return;
    }
    setReport(prev => (prev ? { ...prev, status } : prev));
  };

  const handleAcknowledge = () => updateStatus('ongoing');
  const handleResolve = () => updateStatus('resolved');

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
          <Text style={styles.value}>{formatTimestamp(report.timestamp)}</Text>
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
              disabled={statusUpdating}
              style={{
                backgroundColor: colors.primary.blue,
                paddingVertical: spacing.md,
                borderRadius: 12,
                alignItems: 'center',
                opacity: statusUpdating ? 0.6 : 1,
                ...DesignSystem.shadows.sm,
              }}
            >
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {report.status === 'ongoing' && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleResolve}
              disabled={statusUpdating}
              style={{
                backgroundColor: colors.semantic.success,
                paddingVertical: spacing.md,
                borderRadius: 12,
                alignItems: 'center',
                opacity: statusUpdating ? 0.6 : 1,
                ...DesignSystem.shadows.sm,
              }}
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



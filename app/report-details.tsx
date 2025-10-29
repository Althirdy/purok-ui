/**
 * Report Details Screen - Comprehensive view for a single report
 */

import { safeGet } from '@/api/axios';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import type { EmergencyReport } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
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
    borderRadius: 999,
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
          status: 'acknowledged',
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>{report.title}</Text>
            <View style={styles.pill}><Text style={styles.pillText}>{report.severity.toUpperCase()}</Text></View>
          </View>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{report.id}</Text>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{report.location}</Text>
          <Text style={styles.label}>Captured By</Text>
          <Text style={styles.value}>CCTV-01</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>{report.description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Evidences</Text>
          <View style={{ gap: spacing.sm }}>
            <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral.gray700 }}>
              {/* Replace with actual snapshot URL when available */}
              <Image source={require('@/assets/images/splash-icon.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <View style={{ height: 140, borderRadius: 12, backgroundColor: colors.neutral.gray700, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location" size={22} color={colors.text.inverse} />
              <Text style={{ color: colors.text.inverse, marginTop: 6, fontSize: typography.fontSize.xs }}>Map Pin • {report.location}</Text>
            </View>
          </View>
        </View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}



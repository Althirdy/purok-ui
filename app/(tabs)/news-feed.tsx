/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { safeGet } from '@/api/axios';
import { FilterTabs } from '@/components/news/filter-tabs';
import { ReportCard } from '@/components/news/report-card';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Fonts } from '@/constants/theme';
import type { EmergencyReport, FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Modal, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Inline styles to avoid .styles.ts files being treated as routes
const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: isTablet ? '70%' : '80%',
  },
  
  logoSmall: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: isTablet ? 28 : 24,
    backgroundColor: colors.neutral.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  headerTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  headerSubtitle: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.sm,
    color: colors.text.inverse,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  iconButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  
  titleSection: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  
  sectionTitle: {
    fontSize: isTablet ? typography.fontSize['2xl'] : typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  emergencySection: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingVertical: spacing.md,
  },

  // Report a Concern card
  concernCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  concernHeader: {
    fontSize: isTablet ? typography.fontSize['2xl'] : typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontFamily: Fonts.rounded,
  },
  concernSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  concernOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
  },
  concernIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  concernTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  concernDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  
  currentReportSection: {
    marginBottom: spacing.sm,
  },
  
  currentReportHeader: {
    paddingHorizontal: 0,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  
  currentReportTitle: {
    fontSize: isTablet ? typography.fontSize.lg : typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
  },
  
  listContent: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.xl,
  },
  headerWrapper: {
    marginHorizontal: -(spacing.lg * (isTablet ? 1.5 : 1)),
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'] * (isTablet ? 1.3 : 1),
  },
  
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export default function NewsFeedScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedSource>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [showAckModal, setShowAckModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Bottom sheet animation
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

  const presentSheet = (reportId?: string) => {
    if (reportId) setSelectedReportId(reportId);
    setShowAckModal(true);
    requestAnimationFrame(() => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const dismissSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowAckModal(false);
      setSelectedReportId(null);
    });
  };

  // Fetch reports by source (limited to a single mock item for now)
  const fetchReports = async (source: FeedSource) => {
    setLoading(true);
    try {
      const data = await safeGet<EmergencyReport[]>(`/reports?source=${source}` as string, () => [
        {
          id: 'UW-2025-001',
          type: 'suspicious',
          title: 'Suspicious Activity',
          description: "There's a person suddenly collapsed.",
          location: 'Barangay 176, Near Metroplaza',
          timestamp: new Date(),
          status: 'pending',
          severity: 'high',
          source: 'cctv',
        },
      ]);
      setReports(Array.isArray(data) ? [data[0]] : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(activeFilter);
  }, [activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(activeFilter).finally(() => setRefreshing(false));
  };

  const handleFilterChange = (filter: FeedSource) => {
    setActiveFilter(filter);
    // TODO: Filter reports based on source
  };

  const handleReportPress = (reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  };

  const handleAcknowledge = (reportId: string) => {
    // Open confirmation modal first; do not change state yet
    presentSheet(reportId);
  };

  const confirmAcknowledge = () => {
    if (!selectedReportId) return dismissSheet();
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === selectedReportId
          ? { ...report, status: 'acknowledged' as const }
          : report
      )
    );
    dismissSheet();
  };

  const handleEmergencyReport = () => {
    // Navigate to emergency report screen
    router.push('./emergency-report');
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Ionicons name="shield" size={24} color={colors.primary.blue} />
            </View>
            <View>
              <Text style={styles.headerTitle}>UrbanWatch</Text>
              <Text style={styles.headerSubtitle}>Purok</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications" size={24} color={colors.text.inverse} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => router.push('./profile')}
            >
              <Ionicons name="person" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Report a Concern */}
      <View style={styles.emergencySection}>
        <View style={styles.concernCard}>
          <Text style={styles.concernHeader}>Report a Concern</Text>
          <Text style={styles.concernSub}>Choose how you'd like to report an issue</Text>
          <TouchableOpacity onPress={handleEmergencyReport} activeOpacity={0.8} style={styles.concernOption}>
            <View style={styles.concernIconWrap}>
              <Ionicons name="create-outline" size={22} color={colors.primary.blue} />
            </View>
            <View>
              <Text style={styles.concernTitle}>Manual Report</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Report Section */}
      <View style={styles.currentReportSection}>
        <View style={styles.currentReportHeader}>
          <Text style={styles.currentReportTitle}>
            Current Report ({pendingCount})
          </Text>
          <FilterTabs activeFilter={activeFilter} onFilterChange={handleFilterChange} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Reports List */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => handleReportPress(item.id)}
            onAcknowledge={() => handleAcknowledge(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.orange}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={colors.neutral.gray600} />
            <Text style={styles.emptyStateText}>{loading ? 'Loading reports...' : 'No reports available'}</Text>
          </View>
        }
      />

      {/* Bottom Acknowledgement Sheet (matches mobile UI) */}
      <Modal visible={showAckModal} transparent animationType="none" onRequestClose={dismissSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
              backgroundColor: colors.background.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderColor: colors.border.light,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral.gray600 }} />
            </View>
            {/* Title and brief */}
            <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
              Suspicious Activity
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
              There's a person suddenly collapsed.
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: spacing.sm }}>
              Barangay 176, Near Metroplaza • just now
            </Text>

            {/* Evidence preview */}
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <View style={{ height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral.gray700 }}>
                <View style={{ flex: 1 }}>
                  {/* image placeholder */}
                  <View style={{ flex: 1, backgroundColor: colors.neutral.gray600, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image" size={28} color={colors.text.inverse} />
                    <Text style={{ color: colors.text.inverse, marginTop: 6, fontSize: typography.fontSize.xs }}>CCTV Snapshot</Text>
                  </View>
                </View>
              </View>
              <View style={{ height: 100, borderRadius: 12, backgroundColor: colors.neutral.gray700, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location" size={20} color={colors.text.inverse} />
                <Text style={{ color: colors.text.inverse, marginTop: 6, fontSize: typography.fontSize.xs }}>Map Pin Preview</Text>
              </View>
            </View>

            {/* Actions: See More, Dismiss, Acknowledge */}
            <View style={{ marginTop: spacing.lg }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  dismissSheet();
                  router.push({ pathname: 'report-details', params: { reportId: selectedReportId || 'UW-2025-001' } } as any);
                }}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderWidth: 1,
                  borderColor: colors.text.secondary,
                  paddingVertical: spacing.md,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>See More</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={dismissSheet}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.neutral.gray600, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center', backgroundColor: colors.background.secondary }}
                >
                  <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={confirmAcknowledge}
                  style={{ flex: 1, backgroundColor: colors.accent.orange, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.text.primary, fontWeight: typography.fontWeight.semibold }}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

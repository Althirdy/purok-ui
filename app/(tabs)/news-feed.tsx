/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { safeGet } from '@/api/axios';
import { ReportCard } from '@/components/news/report-card';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import type { EmergencyReport, FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Dimensions, Easing, FlatList, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listenToSensorData, fetchLatestSensorData, sensorDataToReport } from '@/services/firebase-service';

// Inline styles to avoid .styles.ts files being treated as routes
const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
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
    opacity: 0.9,
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
  headerWrapper: {
    marginHorizontal: -(spacing.lg * (isTablet ? 1.5 : 1)),
  },
  // Modern feed utilities
  utilities: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  // Filter grid
  filterGrid: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterBox: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAll: { backgroundColor: '#E6ECF2' },
  iconCctv: { backgroundColor: '#E6F0FF' },
  iconSensor: { backgroundColor: '#EAF7EE' },
  iconCitizen: { backgroundColor: '#F1EAFE' },
  filterBoxLabel: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  filterBoxActive: {
    borderColor: colors.primary.blue,
    backgroundColor: '#EFF6FF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchText: {
    marginLeft: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 14,
    padding: spacing.md,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  statValue: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: isTablet ? typography.fontSize['2xl'] : typography.fontSize.xl,
    marginTop: 2,
  },
  currentReportSection: {
    marginBottom: spacing.sm,
  },
  currentReportHeader: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  currentReportTitle: {
    fontSize: isTablet ? typography.fontSize.lg : typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.xl,
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
  const [newReportCount, setNewReportCount] = useState(0);

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
      // Try to fetch from Firebase first
      let sensorReports: EmergencyReport[] = [];
      
      if (source === 'all' || source === 'sensor_box') {
        try {
          const sensorData = await fetchLatestSensorData(20);
          sensorReports = sensorData.map(data => sensorDataToReport(data));
        } catch (error) {
          console.warn('Error fetching sensor data:', error);
        }
      }

      // Fallback to mock data if needed
      const mockData = await safeGet<EmergencyReport[]>(`/reports?source=${source}` as string, () => [
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

      // Combine sensor reports with mock data
      const allReports = [...sensorReports, ...(Array.isArray(mockData) ? mockData : [])];
      
      // Filter by source if not 'all'
      const filteredReports = source === 'all' 
        ? allReports 
        : allReports.filter(r => {
            if (source === 'sensor_box') return r.source === 'sensor';
            if (source === 'cctv') return r.source === 'cctv';
            if (source === 'citizen_reports') return r.source === 'citizen';
            return true;
          });

      // Sort by timestamp (newest first)
      filteredReports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setReports(filteredReports);
    } finally {
      setLoading(false);
    }
  };

  const handleReportPress = useCallback((reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  }, []);

  // Set up Firebase real-time listener for sensor data
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = listenToSensorData((sensorData, report) => {
        // Check if this report already exists
        setReports(prevReports => {
          const exists = prevReports.some(r => r.id === report.id);
          if (exists) {
            return prevReports;
          }

          // Add new report and show notification
          setNewReportCount(prev => prev + 1);
          
          // Show alert for critical/high severity reports
          if (report.severity === 'critical' || report.severity === 'high') {
            Alert.alert(
              '🚨 New Sensor Alert',
              `${report.title}\n\n${report.description}\n\nLocation: ${report.location}`,
              [
                { text: 'View', onPress: () => handleReportPress(report.id) },
                { text: 'OK', style: 'cancel' },
              ]
            );
          }

          // Add new report at the beginning
          return [report, ...prevReports];
        });
      });
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleReportPress]);

  useEffect(() => {
    fetchReports(activeFilter);
  }, [activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    setNewReportCount(0); // Reset new report count on refresh
    fetchReports(activeFilter).finally(() => setRefreshing(false));
  };

  const handleFilterChange = (filter: FeedSource) => {
    setActiveFilter(filter);
    // TODO: Filter reports based on source
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

  // Manual reporting removed

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Ionicons name="shield" size={24} color={colors.primary.blue} />
            </View>
            <View>
              <Text style={styles.headerTitle}>UrbanWatch</Text>
              <Text style={styles.headerSubtitle}>Purok Feed</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications" size={24} color={colors.text.inverse} />
              {(pendingCount > 0 || newReportCount > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount + newReportCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Utilities: Search + Stats */}
      <View style={styles.utilities}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.text.secondary} />
          <Text style={styles.searchText}>Search incidents, locations…</Text>
          <Ionicons name="options" size={18} color={colors.text.secondary} />
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Acknowledged</Text>
            <Text style={styles.statValue}>{reports.filter(r => r.status === 'acknowledged').length}</Text>
          </View>
        </View>
      </View>

      {/* Current Report Section */}
      <View style={styles.currentReportSection}>
        <View style={styles.currentReportHeader}>
          <Text style={styles.currentReportTitle}>Current Reports ({pendingCount})</Text>
        </View>
      </View>
      {/* Modern filter boxes */}
      <View style={styles.filterGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleFilterChange('all')}
          style={[
            styles.filterBox,
            activeFilter === 'all' && styles.filterBoxActive,
          ]}
        >
          <Text style={styles.filterBoxLabel}>All</Text>
          <View style={[styles.filterIconWrap, styles.iconAll]}>
            <Ionicons
              name="apps-outline"
              size={18}
              color={activeFilter === 'all' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleFilterChange('cctv')}
          style={[
            styles.filterBox,
            activeFilter === 'cctv' && styles.filterBoxActive,
          ]}
        >
          <Text style={styles.filterBoxLabel}>CCTV</Text>
          <View style={[styles.filterIconWrap, styles.iconCctv]}>
            <Ionicons
              name="videocam-outline"
              size={18}
              color={activeFilter === 'cctv' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleFilterChange('sensor_box')}
          style={[
            styles.filterBox,
            activeFilter === 'sensor_box' && styles.filterBoxActive,
          ]}
        >
          <Text style={styles.filterBoxLabel}>Sensor Box</Text>
          <View style={[styles.filterIconWrap, styles.iconSensor]}>
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={activeFilter === 'sensor_box' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleFilterChange('citizen_reports')}
          style={[
            styles.filterBox,
            activeFilter === 'citizen_reports' && styles.filterBoxActive,
          ]}
        >
          <Text style={styles.filterBoxLabel}>Citizen</Text>
          <View style={[styles.filterIconWrap, styles.iconCitizen]}>
            <Ionicons
              name="people-outline"
              size={18}
              color={activeFilter === 'citizen_reports' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>
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
            tintColor={colors.primary.blue}
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
          {/* Overlay press to dismiss */}
          <Pressable onPress={dismissSheet} style={{ flex: 1 }} />
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

            {/* Actions: Acknowledge only */}
            <View style={{ marginTop: spacing.lg }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={confirmAcknowledge}
                style={{ backgroundColor: colors.primary.blue, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

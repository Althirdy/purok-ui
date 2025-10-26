/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { Button } from '@/components/common/button';
import { FilterTabs } from '@/components/news/filter-tabs';
import { ReportCard } from '@/components/news/report-card';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { mockUser } from '@/services/mock-data';
import type { EmergencyReport, FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Inline styles to avoid .styles.ts files being treated as routes
const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.navy,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.md,
    paddingTop: isIOS ? spacing.sm : spacing.xs,
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
    backgroundColor: `${colors.accent.orange}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  headerTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  headerSubtitle: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.sm,
    color: colors.text.secondary,
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
    backgroundColor: colors.background.secondary,
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
    color: colors.text.primary,
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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      // TODO: Fetch reports from API
      setRefreshing(false);
    }, 1000);
  };

  const handleFilterChange = (filter: FeedSource) => {
    setActiveFilter(filter);
    // TODO: Filter reports based on source
  };

  const handleReportPress = (reportId: string) => {
    // Navigate to report details
    console.log('Report pressed:', reportId);
  };

  const handleAcknowledge = (reportId: string) => {
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId
          ? { ...report, status: 'acknowledged' as const }
          : report
      )
    );
  };

  const handleEmergencyReport = () => {
    // Navigate to emergency report screen
    router.push('./emergency-report');
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Ionicons name="shield" size={24} color={colors.accent.orange} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{mockUser.purokName}</Text>
              <Text style={styles.headerSubtitle}>{mockUser.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications" size={24} color={colors.text.primary} />
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
              <Ionicons name="person" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* News and Report Feed Title */}
      <View style={styles.titleSection}>
        <Text style={styles.sectionTitle}>News and Report Feed</Text>
      </View>

      {/* Emergency Report Button */}
      <View style={styles.emergencySection}>
        <Button
          title="Emergency report"
          onPress={handleEmergencyReport}
          variant="primary"
          fullWidth
          icon={<Ionicons name="warning" size={20} color={colors.text.primary} />}
        />
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
            <Text style={styles.emptyStateText}>No reports available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { Button } from '@/components/common/button';
import { FilterTabs } from '@/components/news/filter-tabs';
import { ReportCard } from '@/components/news/report-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { getReportsBySource, mockReports, mockUser } from '@/services/mock-data';
import type { EmergencyReport, FeedSource } from '@/types';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

export default function NewsFeedScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedSource>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<EmergencyReport[]>(mockReports);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setReports(getReportsBySource(activeFilter));
      setRefreshing(false);
    }, 1000);
  };

  const handleFilterChange = (filter: FeedSource) => {
    setActiveFilter(filter);
    setReports(getReportsBySource(filter));
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
    console.log('Emergency report pressed');
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <IconSymbol name="shield.fill" size={24} color={colors.accent.orange} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{mockUser.purokName}</Text>
              <Text style={styles.headerSubtitle}>{mockUser.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="bell.fill" size={24} color={colors.text.primary} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="person.fill" size={24} color={colors.text.primary} />
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
          icon={<IconSymbol name="exclamationmark.circle.fill" size={20} color={colors.text.primary} />}
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
            <IconSymbol name="tray.fill" size={64} color={colors.neutral.gray600} />
            <Text style={styles.emptyStateText}>No reports available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  },
  
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.accent.orange}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  
  emergencySection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  
  currentReportSection: {
    marginBottom: spacing.sm,
  },
  
  currentReportHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  
  currentReportTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});


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
import { useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './news-feed.styles';

const { colors } = DesignSystem;

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
            <TouchableOpacity style={styles.iconButton}>
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

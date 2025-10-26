/**
 * Reports Screen - View all reports and their history
 */

import { ReportCard } from '@/components/news/report-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
// import { mockReports } from '@/services/mock-data';
import type { EmergencyReport } from '@/types';
import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './reports.styles';

const { colors } = DesignSystem;

type ReportStatus = 'all' | 'pending' | 'acknowledged' | 'resolved';

export default function ReportsScreen() {
  const [activeStatus, setActiveStatus] = useState<ReportStatus>('all');
  const [reports] = useState<EmergencyReport[]>([]);

  const filteredReports = reports.filter(report => 
    activeStatus === 'all' ? true : report.status === activeStatus
  );

  const statusTabs: { key: ReportStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: reports.length },
    { key: 'pending', label: 'Pending', count: reports.filter(r => r.status === 'pending').length },
    { key: 'acknowledged', label: 'Active', count: reports.filter(r => r.status === 'acknowledged').length },
    { key: 'resolved', label: 'Resolved', count: reports.filter(r => r.status === 'resolved').length },
  ];

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Reports</Text>
        <TouchableOpacity style={styles.filterButton}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeStatus === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveStatus(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeStatus === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            <View style={[
              styles.tabBadge,
              activeStatus === tab.key && styles.tabBadgeActive,
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeStatus === tab.key && styles.tabBadgeTextActive,
              ]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => console.log('Report pressed:', item.id)}
            onAcknowledge={() => console.log('Acknowledge:', item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="tray.fill" size={64} color={colors.neutral.gray600} />
            <Text style={styles.emptyStateText}>No reports in this category</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

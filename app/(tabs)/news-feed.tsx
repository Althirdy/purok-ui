/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { Toast, type ToastData } from '@/components/common/toast';
import { EmptyState } from '@/components/news/empty-state';
import { FilterModal } from '@/components/news/filter-modal';
import { IncidentHeader } from '@/components/news/incident-header';
import { ReportCard } from '@/components/news/report-card';
import { ResolveSheet } from '@/components/news/resolve-sheet';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport, FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.xl,
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  floatingBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default function NewsFeedScreen() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedSource>('all');
  const [toast, setToast] = useState<ToastData | null>(null);
  const { addNotification, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ongoing' | 'resolved'>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'manual' | 'voice'>('all');
  const [resolveTarget, setResolveTarget] = useState<EmergencyReport | null>(null);

  const handleReportPress = useCallback((reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  }, []);

  const {
    reports,
    loading,
    refreshing,
    fetchReports,
    handleRefresh,
    updateReportStatus,
  } = useReportsFeed({
    onNewReport: (report) => {
      if ((report.severity === 'critical' || report.severity === 'high') && !toast) {
        setToast({
          id: `toast-${report.id}-${Date.now()}`,
          title: report.severity === 'critical' ? '🚨 Critical Alert' : '⚠️ Alert',
          message: report.title,
          severity: report.severity,
          reportType: report.type,
          onPress: () => handleReportPress(report.id),
        });
      }
    },
  });

  // Debounce live search so it filters shortly after typing
  useEffect(() => {
    const handle = setTimeout(() => {
      setCommittedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Fetch reports when filter changes
  useEffect(() => {
    fetchReports(activeFilter);
  }, [activeFilter, fetchReports]);

  // Handle resolve - mark report as resolved and push notification
  const handleResolvePress = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status === 'resolved') return;

    // Mark as resolved
    updateReportStatus(reportId, 'resolved');

    // Add notification
    addNotification({
      id: `update-${r.id}-${Date.now()}`,
      type: 'report_update',
      title: 'Report Resolved',
      message: r.title,
      reportId: r.id,
      timestamp: new Date(),
      read: false,
    });
  }, [reports, addNotification, updateReportStatus]);

  // Handle acknowledge button - directly opens resolve modal
  const handleActionPress = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r) return;
    // Directly open resolve modal when acknowledge is pressed
    setResolveTarget(r);
  }, [reports]);

  // Optimized renderItem with memoized callbacks
  const renderReportItem = useCallback(({ item }: { item: EmergencyReport }) => {
    return (
      <ReportCard
        report={item}
        onPress={item.status === 'pending' ? handleReportPress : undefined}
        onAcknowledge={item.status === 'pending' ? handleActionPress : undefined}
      />
    );
  }, [handleReportPress, handleActionPress]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: EmergencyReport) => item.id, []);

  // Calculate counts for header (memoized to prevent recalculation)
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);
  const ongoingCount = useMemo(() => reports.filter(r => r.status === 'acknowledged').length, [reports]);
  const totalCount = reports.length;
  
  // Derived: reports filtered by search query
  const displayedReports = useMemo(() => {
    const q = committedQuery.trim().toLowerCase();
    // Apply status filter
    let base = reports;
    if (statusFilter !== 'all') {
      const targetStatus = statusFilter === 'ongoing' ? 'acknowledged' : statusFilter;
      base = base.filter(r => r.status === targetStatus);
    }
    // Note: reportTypeFilter is reserved for future manual/voice classification
    if (!q) return base;
    return base.filter(r => {
      const title = r.title?.toLowerCase() ?? '';
      const location = r.location?.toLowerCase() ?? '';
      return title.includes(q) || location.includes(q);
    });
  }, [reports, committedQuery, statusFilter]);
  
  const handleFilterChange = useCallback((filter: FeedSource) => {
    setActiveFilter(filter);
  }, []);

  // Memoize header component - only recompute when dependencies change
  const memoizedHeader = useMemo(() => {
    return (
      <IncidentHeader
        activeFilter={activeFilter}
        statusFilter={statusFilter}
        reportTypeFilter={reportTypeFilter}
        pendingCount={pendingCount}
        resolvedCount={resolvedCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        committedQuery={committedQuery}
        setCommittedQuery={setCommittedQuery}
        onFilterPress={() => setIsFilterModalVisible(true)}
        onFeedFilterChange={handleFilterChange}
        setStatusFilter={setStatusFilter}
        setReportTypeFilter={setReportTypeFilter}
      />
    );
  }, [activeFilter, pendingCount, resolvedCount, statusFilter, reportTypeFilter, searchQuery, committedQuery, handleFilterChange]);

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Reports List */}
      <FlatList
        data={displayedReports}
        keyExtractor={keyExtractor}
        renderItem={renderReportItem}
        ListHeaderComponent={memoizedHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => handleRefresh(activeFilter)}
            tintColor={colors.primary.blue}
          />
        }
        ListEmptyComponent={<EmptyState loading={loading} />}
        // Performance optimizations for rapid data
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        // Note: getItemLayout removed - items have variable heights based on content
      />

      {/* Floating notification bell (fixed on screen, follows scroll like uw-citizen) */}
      <TouchableOpacity
        style={styles.floatingButton}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/notifications' as any)}
      >
        <Ionicons name="notifications" size={24} color={colors.text.inverse} />
        {unreadCount > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        statusFilter={statusFilter}
        reportTypeFilter={reportTypeFilter}
        totalCount={totalCount}
        pendingCount={pendingCount}
        ongoingCount={ongoingCount}
        resolvedCount={resolvedCount}
        onStatusFilterChange={setStatusFilter}
        onReportTypeFilterChange={setReportTypeFilter}
        onClose={() => setIsFilterModalVisible(false)}
        onClearAll={() => {
          setStatusFilter('all');
          setReportTypeFilter('all');
          setIsFilterModalVisible(false);
        }}
      />

      {/* Resolve confirmation sheet */}
      <ResolveSheet
        visible={!!resolveTarget}
        report={resolveTarget}
        onConfirm={() => {
          if (resolveTarget) {
            handleResolvePress(resolveTarget.id);
          }
          setResolveTarget(null);
        }}
        onCancel={() => setResolveTarget(null)}
      />

      {/* Modern Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} duration={5000} />
    </SafeAreaView>
  );
}

/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { Toast, type ToastData } from '@/components/common/toast';
import { AcknowledgeSheet } from '@/components/news/acknowledge-sheet';
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
    borderWidth: 2,
    borderColor: colors.primary.blue,
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
  const [acknowledgeTarget, setAcknowledgeTarget] = useState<EmergencyReport | null>(null);
  const [resolveTarget, setResolveTarget] = useState<EmergencyReport | null>(null);

  const handleReportPress = useCallback((reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  }, []);

  // Memoize the onNewReport callback to prevent unnecessary re-subscriptions
  const handleNewReport = useCallback((report: EmergencyReport) => {
    console.log('[NewsFeed] ✅ New report received, showing toast:', {
      id: report.id,
      title: report.title,
      severity: report.severity,
    });
    
    // Always show toast for new reports (replace existing toast if any)
    // First clear existing toast to ensure new one animates in
    setToast(null);
    
    // Use setTimeout to ensure the previous toast is cleared before showing new one
    setTimeout(() => {
      const title = report.severity === 'critical' 
        ? '🚨 New Critical Concern' 
        : report.severity === 'high'
        ? '⚠️ New High Priority Concern'
        : report.severity === 'medium'
        ? '📋 New Medium Priority Concern'
        : '📝 New Concern';
      
      const toastData = {
        id: `toast-${report.id}-${Date.now()}`,
        title,
        message: report.title,
        severity: report.severity,
        reportType: report.type,
        onPress: () => handleReportPress(report.id),
      };
      
      console.log('[NewsFeed] ✅ Setting toast:', toastData.id);
      setToast(toastData);
    }, 100);
  }, [handleReportPress]);

  const {
    reports,
    loading,
    refreshing,
    fetchReports,
    handleRefresh,
    updateReportStatus,
  } = useReportsFeed({
    onNewReport: handleNewReport,
  });
  
  // Debounce live search so it filters shortly after typing
  useEffect(() => {
    const handle = setTimeout(() => {
      setCommittedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Fetch reports only on initial mount (not on filter change)
  // Filtering is done client-side in displayedReports for better performance
  useEffect(() => {
    fetchReports('all'); // Always fetch all reports, filter client-side
  }, [fetchReports]);

  // Handle acknowledge - mark report as acknowledged (first step)
  const handleAcknowledgePress = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status !== 'pending') return;

    // Mark as acknowledged
    updateReportStatus(reportId, 'acknowledged');
      
    // Add notification
    addNotification({
      id: `acknowledge-${r.id}-${Date.now()}`,
      type: 'report_update',
      title: 'Report Acknowledged',
      message: r.title,
      reportId: r.id,
      timestamp: new Date(),
      read: false,
    });
  }, [reports, addNotification, updateReportStatus]);

  // Handle resolve - mark report as resolved (second step)
  const handleResolvePress = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status === 'resolved') return;

    // Mark as resolved
    updateReportStatus(reportId, 'resolved');
      
    // Add notification
    addNotification({
      id: `resolve-${r.id}-${Date.now()}`,
      type: 'report_update',
      title: 'Report Resolved',
      message: r.title,
      reportId: r.id,
      timestamp: new Date(),
      read: false,
    });
  }, [reports, addNotification, updateReportStatus]);

  // Handle acknowledge button - opens acknowledge modal (first step)
  const handleAcknowledgeAction = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status !== 'pending') return;
    setAcknowledgeTarget(r);
  }, [reports]);

  // Handle resolve button - opens resolve modal (second step)
  const handleResolveAction = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status !== 'acknowledged') return;
    setResolveTarget(r);
  }, [reports]);

  // Optimized renderItem with memoized callbacks
  // All cards are clickable regardless of status
  // Use useMemo to create stable props object per item
  const renderReportItem = useCallback(({ item }: { item: EmergencyReport }) => {
    // Create stable callback references based on item status
    const acknowledgeCallback = item.status === 'pending' ? handleAcknowledgeAction : undefined;
    const resolveCallback = item.status === 'acknowledged' ? handleResolveAction : undefined;
    
    return (
      <ReportCard
        report={item}
        onPress={handleReportPress}
        onAcknowledge={acknowledgeCallback}
        onResolve={resolveCallback}
      />
    );
  }, [handleReportPress, handleAcknowledgeAction, handleResolveAction]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: EmergencyReport) => item.id, []);

  // Calculate counts for header (memoized to prevent recalculation)
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);
  const ongoingCount = useMemo(() => reports.filter(r => r.status === 'acknowledged').length, [reports]);
  const totalCount = reports.length;
  
  // Calculate report type counts (manual vs voice) - only for citizen reports
  const manualCount = useMemo(() => {
    return reports.filter(r => {
      if (r.source !== 'citizen') return false;
      // Check reportType field first, then fallback to audio field or category
      if (r.reportType) {
        return r.reportType === 'manual';
      }
      // Fallback: determine from audio field or category
      const hasAudio = r.audio && r.audio.trim().length > 0;
      const isVoiceCategory = r.title?.toLowerCase().includes('voice concern') || 
                              r.description?.toLowerCase().includes('audio recording');
      return !hasAudio && !isVoiceCategory;
    }).length;
  }, [reports]);
  
  const voiceCount = useMemo(() => {
    return reports.filter(r => {
      if (r.source !== 'citizen') return false;
      // Check reportType field first, then fallback to audio field or category
      if (r.reportType) {
        return r.reportType === 'voice';
      }
      // Fallback: determine from audio field or category
      const hasAudio = r.audio && r.audio.trim().length > 0;
      const isVoiceCategory = r.title?.toLowerCase().includes('voice concern') || 
                              r.description?.toLowerCase().includes('audio recording');
      return hasAudio || isVoiceCategory;
    }).length;
  }, [reports]);
  
  // Derived: reports filtered by search query and source (category)
  const displayedReports = useMemo(() => {
    const q = committedQuery.trim().toLowerCase();
    // Apply source filter (category: all, cctv, sensor_box, citizen_reports)
    let base = reports;
    if (activeFilter !== 'all') {
      base = base.filter(r => {
        if (activeFilter === 'sensor_box') return r.source === 'sensor';
        if (activeFilter === 'cctv') return r.source === 'cctv';
        if (activeFilter === 'citizen_reports') return r.source === 'citizen';
        return true;
      });
    }
    // Apply status filter
    if (statusFilter !== 'all') {
      const targetStatus = statusFilter === 'ongoing' ? 'acknowledged' : statusFilter;
      base = base.filter(r => r.status === targetStatus);
    }
    // Apply report type filter (manual vs voice)
    // Only applies to citizen reports (sensor reports don't have reportType)
    if (reportTypeFilter !== 'all') {
      base = base.filter(r => {
        // For citizen reports, filter by reportType
        if (r.source === 'citizen') {
          // Check reportType field first
          if (r.reportType) {
            return r.reportType === reportTypeFilter;
          }
          // Fallback: determine from audio field or title/description
          const hasAudio = r.audio && r.audio.trim().length > 0;
          const isVoiceCategory = r.title?.toLowerCase().includes('voice concern') || 
                                  r.description?.toLowerCase().includes('audio recording');
          const determinedType = (hasAudio || isVoiceCategory) ? 'voice' : 'manual';
          return determinedType === reportTypeFilter;
        }
        // For non-citizen reports (sensor, cctv), show all when filtering by type
        return true; // Show sensor/cctv reports in all type filters
      });
    }
    if (!q) return base;
    return base.filter(r => {
      const title = r.title?.toLowerCase() ?? '';
      const location = r.location?.toLowerCase() ?? '';
      return title.includes(q) || location.includes(q);
    });
  }, [reports, committedQuery, statusFilter, activeFilter, reportTypeFilter]);
  
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
            onRefresh={() => handleRefresh('all')} // Always refresh all, filter client-side
            tintColor={colors.primary.blue}
          />
        }
        ListEmptyComponent={<EmptyState loading={loading} />}
        // Performance optimizations for rapid data
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={15}
        windowSize={21}
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
        manualCount={manualCount}
        voiceCount={voiceCount}
        onStatusFilterChange={setStatusFilter}
        onReportTypeFilterChange={setReportTypeFilter}
        onClose={() => setIsFilterModalVisible(false)}
        onClearAll={() => {
          setStatusFilter('all');
          setReportTypeFilter('all');
          setIsFilterModalVisible(false);
        }}
      />

      {/* Acknowledge sheet (first step) */}
      <AcknowledgeSheet
        visible={!!acknowledgeTarget}
        report={acknowledgeTarget}
        onConfirm={() => {
          if (acknowledgeTarget) {
            handleAcknowledgePress(acknowledgeTarget.id);
          }
          setAcknowledgeTarget(null);
        }}
        onCancel={() => setAcknowledgeTarget(null)}
      />

      {/* Resolve confirmation sheet (second step) */}
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
      {toast && (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onDismiss={() => {
            console.log('[NewsFeed] Toast dismissed:', toast.id);
            setToast(null);
          }} 
          duration={5000} 
        />
      )}
    </SafeAreaView>
  );
}

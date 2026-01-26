/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { DraggableNotificationBell } from '@/components/common/draggable-notification-bell';
import { Toast, type ToastData } from '@/components/common/toast';
import { EmptyState } from '@/components/news/empty-state';
import { IncidentHeader } from '@/components/news/incident-header';
import { ReportCard } from '@/components/news/report-card';
import { ReportCardSkeleton } from '@/components/news/report-card-skeleton';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { router } from 'expo-router';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Lazy load heavy modals/sheets - only load when needed
const AcknowledgeSheet = lazy(() => import('@/components/news/acknowledge-sheet').then(m => ({ default: m.AcknowledgeSheet })));
const ResolveSheet = lazy(() => import('@/components/news/resolve-sheet').then(m => ({ default: m.ResolveSheet })));
const FilterModal = lazy(() => import('@/components/news/filter-modal').then(m => ({ default: m.FilterModal })));

const { colors, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.xl,
  },
});

export default function NewsFeedScreen() {
  const { user } = useAuth();
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


  const {
    reports,
    loading,
    refreshing,
    fetchReports,
    handleRefresh,
    updateReportStatus,
  } = useReportsFeed({
    onNewReport: async (report) => {
      // Show toast for ANY new report from Pusher - no conditions, always show
      console.log('[NewsFeed] 🎯 New report received from Pusher - showing toast:', {
        id: report.id,
        title: report.title,
        severity: report.severity,
        timestamp: new Date().toISOString(),
      });

      // Haptic feedback based on report category (not severity)
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        const category = report.originalCategory || 'other';
        
        // Map categories to haptic feedback intensity
        let feedbackStyle = ImpactFeedbackStyle.Light; // Default
        if (category === 'safety' || category === 'security') {
          feedbackStyle = ImpactFeedbackStyle.Heavy; // Most urgent categories
        } else if (category === 'infrastructure' || category === 'environment') {
          feedbackStyle = ImpactFeedbackStyle.Medium; // Medium priority categories
        } else {
          // 'noise', 'other', 'voice_concern' or unknown -> Light
          feedbackStyle = ImpactFeedbackStyle.Light;
        }
        
        impactAsync(feedbackStyle);
        console.log('[NewsFeed] ✅ Haptic feedback triggered for category:', category);
      } catch (error) {
        console.error('[NewsFeed] Error with haptic feedback:', error);
      }

      // Show toast with report title/header - always show for any new report
      const toastId = `toast-${report.id}-${Date.now()}`;
      const reportId = report.id; // Capture report ID for navigation
      
      setToast({
        id: toastId,
        title: '📢 New Report',
        message: report.title || report.description || 'New concern reported',
        severity: report.severity || 'low',
        reportType: report.type,
        onPress: () => {
          console.log('[NewsFeed] 🎯 Toast pressed - navigating to report:', reportId);
          handleReportPress(reportId);
        },
      });
      
      // Note: Notification is added in the useReportsFeed hook
      console.log('[NewsFeed] ✅ Toast displayed for new report');
    },
  });

  // Debug: Log toast state changes
  useEffect(() => {
    if (toast) {
      console.log('[NewsFeed] 📱 Toast state updated:', {
        id: toast.id,
        title: toast.title,
        message: toast.message,
        severity: toast.severity,
      });
    } else {
      console.log('[NewsFeed] 📱 Toast dismissed');
    }
  }, [toast]);

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
  const handleAcknowledgePress = useCallback(async (reportId: string, remarks?: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status !== 'pending') return;

    try {
      // Mark as acknowledged with optional remarks
      await updateReportStatus(reportId, 'acknowledged', remarks);

      // Add notification after successful update
      addNotification({
        id: `acknowledge-${r.id}-${Date.now()}`,
        type: 'report_update',
        title: 'Report Acknowledged',
        message: r.title,
        reportId: r.id,
        timestamp: new Date(),
        read: false,
      });
    } catch (error) {
      console.error('[NewsFeed] Failed to acknowledge report:', error);
    }
  }, [reports, addNotification, updateReportStatus]);

  // Handle resolve - mark report as resolved (second step)
  const handleResolvePress = useCallback(async (reportId: string, remarks?: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status === 'resolved') return;

    try {
      // Mark as resolved with optional remarks
      await updateReportStatus(reportId, 'resolved', remarks);

      // Add notification after successful update
      addNotification({
        id: `resolve-${r.id}-${Date.now()}`,
        type: 'report_update',
        title: 'Report Resolved',
        message: r.title,
        reportId: r.id,
        timestamp: new Date(),
        read: false,
      });
    } catch (error) {
      console.error('[NewsFeed] Failed to resolve report:', error);
    }
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
  const renderReportItem = useCallback(({ item, index }: { item: EmergencyReport; index: number }) => {
    // Create stable callback references based on item status
    const acknowledgeCallback = item.status === 'pending' ? handleAcknowledgeAction : undefined;
    const resolveCallback = item.status === 'acknowledged' ? handleResolveAction : undefined;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(120 + index * 40).duration(450)}
      >
        <ReportCard
          report={item}
          onPress={handleReportPress}
          onAcknowledge={acknowledgeCallback}
          onResolve={resolveCallback}
        />
      </Animated.View>
    );
  }, [handleReportPress, handleAcknowledgeAction, handleResolveAction]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: EmergencyReport) => item.id, []);

  // Calculate counts for header (memoized to prevent recalculation)
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);
  const ongoingCount = useMemo(() => reports.filter(r => r.status === 'acknowledged').length, [reports]);
  const manualCount = useMemo(() => reports.filter(r => r.reportType === 'manual' || (!r.reportType && !r.audio)).length, [reports]);
  const voiceCount = useMemo(() => reports.filter(r => r.reportType === 'voice' || !!r.audio).length, [reports]);
  const totalCount = reports.length;
  
  // Derived: reports filtered by search query, status, and report type
  const displayedReports = useMemo(() => {
    const q = committedQuery.trim().toLowerCase();
    let base = reports;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const targetStatus = statusFilter === 'ongoing' ? 'acknowledged' : statusFilter;
      base = base.filter(r => r.status === targetStatus);
    }
    
    // Apply report type filter (manual vs voice)
    if (reportTypeFilter !== 'all') {
      if (reportTypeFilter === 'voice') {
        // Voice reports have reportType === 'voice' or have audio
        base = base.filter(r => r.reportType === 'voice' || !!r.audio);
      } else if (reportTypeFilter === 'manual') {
        // Manual reports have reportType === 'manual' or no reportType and no audio
        base = base.filter(r => r.reportType === 'manual' || (!r.reportType && !r.audio));
      }
    }
    
    // Apply search query filter
    if (!q) return base;
    return base.filter(r => {
      const title = r.title?.toLowerCase() ?? '';
      const location = r.location?.toLowerCase() ?? '';
      return title.includes(q) || location.includes(q);
    });
  }, [reports, committedQuery, statusFilter, reportTypeFilter]);
  
  // Memoize header component - only recompute when dependencies change
  const memoizedHeader = useMemo(() => {
    return (
      <IncidentHeader
        statusFilter={statusFilter}
        reportTypeFilter={reportTypeFilter}
        pendingCount={pendingCount}
        acknowledgedCount={ongoingCount}
        resolvedCount={resolvedCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        committedQuery={committedQuery}
        setCommittedQuery={setCommittedQuery}
        onFilterPress={() => setIsFilterModalVisible(true)}
        setStatusFilter={setStatusFilter}
        setReportTypeFilter={setReportTypeFilter}
      />
    );
  }, [pendingCount, ongoingCount, resolvedCount, statusFilter, reportTypeFilter, searchQuery, committedQuery]);

  return (
    <View style={globalStyles.container}>
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
        ListEmptyComponent={
          loading
            ? <ReportCardSkeleton count={4} />
            : <EmptyState loading={false} />
        }
        // Performance optimizations for rapid data
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={15}
        windowSize={21}
        // Note: getItemLayout removed - items have variable heights based on content
      />

      {/* Draggable Notification Bell - users can position it anywhere */}
      <DraggableNotificationBell unreadCount={unreadCount} />

      {/* Filter Modal - Lazy loaded */}
      {isFilterModalVisible && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Acknowledge sheet (first step) - Lazy loaded */}
      {acknowledgeTarget && (
        <Suspense fallback={null}>
          <AcknowledgeSheet
            visible={!!acknowledgeTarget}
            report={acknowledgeTarget}
            onConfirm={(remarks) => {
              if (acknowledgeTarget) {
                handleAcknowledgePress(acknowledgeTarget.id, remarks);
              }
              setAcknowledgeTarget(null);
            }}
            onCancel={() => setAcknowledgeTarget(null)}
          />
        </Suspense>
      )}

      {/* Resolve confirmation sheet (second step) - Lazy loaded */}
      {resolveTarget && (
        <Suspense fallback={null}>
          <ResolveSheet
            visible={!!resolveTarget}
            report={resolveTarget}
            onConfirm={(remarks) => {
              if (resolveTarget) {
                handleResolvePress(resolveTarget.id, remarks);
              }
              setResolveTarget(null);
            }}
            onCancel={() => setResolveTarget(null)}
          />
        </Suspense>
      )}

      {/* Modern Toast Notification - Key prop ensures re-render on new toast */}
      <Toast key={toast?.id || 'no-toast'} toast={toast} onDismiss={() => setToast(null)} duration={5000} />
    </View>
  );
}

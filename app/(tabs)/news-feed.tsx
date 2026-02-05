/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { AnomalyCard } from '@/components/anomaly/anomaly-card';
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
import { useAnomalyFeed } from '@/hooks/use-anomaly-feed';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import type { AnomalyLog } from '@/types/anomaly';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Lazy load heavy modals/sheets - only load when needed
const AcknowledgeSheet = lazy(() => import('@/components/news/acknowledge-sheet').then(m => ({ default: m.AcknowledgeSheet })));
const ResolveSheet = lazy(() => import('@/components/news/resolve-sheet').then(m => ({ default: m.ResolveSheet })));
const FilterModal = lazy(() => import('@/components/news/filter-modal').then(m => ({ default: m.FilterModal })));

import type { AnomalyTypeFilter } from '@/components/news/filter-modal';

const { colors, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// Unified feed item type - can be either a report or an anomaly
type FeedItem = 
  | { type: 'report'; data: EmergencyReport; timestamp: Date }
  | { type: 'anomaly'; data: AnomalyLog; timestamp: Date };

// Feed type for tab selection
type FeedType = 'concerns' | 'anomalies';

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.xl,
  },
  // Simple underline tab style
  feedTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: spacing.md,
  },
  feedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  feedTabActive: {
    borderBottomColor: colors.primary.blue,
  },
  feedTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94a3b8',
  },
  feedTabTextActive: {
    fontWeight: '600',
    color: colors.primary.blue,
  },
});

export default function NewsFeedScreen() {
  const { user } = useAuth();
  const [toast, setToast] = useState<ToastData | null>(null);
  const { unreadCount, notifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ongoing' | 'resolved'>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'manual' | 'voice'>('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<AnomalyTypeFilter>('all');
  const [acknowledgeTarget, setAcknowledgeTarget] = useState<EmergencyReport | null>(null);
  const [resolveTarget, setResolveTarget] = useState<EmergencyReport | null>(null);
  const [feedType, setFeedType] = useState<FeedType>('concerns');

  // Debug: Log unreadCount changes
  useEffect(() => {
    console.log('[NewsFeed] 🔔 Unread count updated:', unreadCount, 'Total notifications:', notifications.length);
  }, [unreadCount, notifications.length]);

  const handleReportPress = useCallback((reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  }, []);

  const handleAnomalyPress = useCallback((anomalyId: number) => {
    router.push({ pathname: 'anomaly-details', params: { anomalyId: String(anomalyId) } } as any);
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

  // Anomaly Feed - IoT Box anomalies
  const {
    anomalies,
    loading: anomaliesLoading,
    refreshAnomalies,
  } = useAnomalyFeed({
    onNewAnomaly: async (anomaly) => {
      // Get display name - handle device_name, name, or location_name fields
      const iotBoxName = anomaly.iot_box?.device_name || anomaly.iot_box?.location_name || anomaly.iot_box?.name || `Device ${anomaly.iot_box?.id}`;
      // Handle location as object or string
      const locationObj = anomaly.location;
      const locationName = anomaly.iot_box?.display_location || 
        (typeof locationObj === 'object' && locationObj ? `${locationObj.location_name}, ${locationObj.barangay}` : locationObj) ||
        anomaly.iot_box?.barangay || 
        'Unknown location';
      
      console.log('[NewsFeed] 🚨 New anomaly received from Pusher:', {
        id: anomaly.id,
        type: anomaly.anomaly_type,
        label: anomaly.anomaly_type_label,
        iotBox: iotBoxName,
      });

      // Haptic feedback for anomalies - always heavy for alerts
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Heavy);
        console.log('[NewsFeed] ✅ Haptic feedback triggered for anomaly');
      } catch (error) {
        console.error('[NewsFeed] Error with haptic feedback:', error);
      }

      // Show toast for new anomaly
      setToast({
        id: `toast-anomaly-${anomaly.id}-${Date.now()}`,
        title: `🚨 ${anomaly.anomaly_type_label}`,
        message: `Detected at ${iotBoxName} - ${locationName}`,
        severity: 'high',
      });
      
      console.log('[NewsFeed] ✅ Toast displayed for new anomaly');
    },
  });

  // Refresh reports when screen gains focus (e.g., coming back from report-details)
  // This ensures the news-feed stays in sync after status updates on other screens
  useFocusEffect(
    useCallback(() => {
      console.log('[NewsFeed] 👁️ Screen focused - refreshing reports and anomalies...');
      fetchReports('all');
      refreshAnomalies();
    }, [fetchReports, refreshAnomalies])
  );

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
      
      // Show success toast
      setToast({
        id: `toast-ack-${reportId}-${Date.now()}`,
        title: '✅ Report Acknowledged',
        message: r.title || 'Concern has been acknowledged',
        severity: 'low',
      });
    } catch (error) {
      console.error('[NewsFeed] Failed to acknowledge report:', error);
      // Show error toast
      setToast({
        id: `toast-ack-error-${Date.now()}`,
        title: '❌ Failed to Acknowledge',
        message: 'Please try again',
        severity: 'high',
      });
    }
  }, [reports, updateReportStatus]);

  // Handle resolve - mark report as resolved (second step)
  const handleResolvePress = useCallback(async (reportId: string, remarks?: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r || r.status === 'resolved') return;

    try {
      // Mark as resolved with optional remarks
      await updateReportStatus(reportId, 'resolved', remarks);
      
      // Show success toast
      setToast({
        id: `toast-resolve-${reportId}-${Date.now()}`,
        title: '✅ Report Resolved',
        message: r.title || 'Concern has been resolved',
        severity: 'low',
      });
    } catch (error) {
      console.error('[NewsFeed] Failed to resolve report:', error);
      // Show error toast
      setToast({
        id: `toast-resolve-error-${Date.now()}`,
        title: '❌ Failed to Resolve',
        message: 'Please try again',
        severity: 'high',
      });
    }
  }, [reports, updateReportStatus]);

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

  // Render anomaly item
  const renderAnomalyItem = useCallback(({ item, index }: { item: AnomalyLog; index: number }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(120 + index * 40).duration(450)}
      >
        <AnomalyCard
          anomaly={item}
          onPress={handleAnomalyPress}
        />
      </Animated.View>
    );
  }, [handleAnomalyPress]);

  // Unified render item for mixed feed
  const renderFeedItem = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    if (item.type === 'report') {
      return renderReportItem({ item: item.data, index });
    } else {
      return renderAnomalyItem({ item: item.data, index });
    }
  }, [renderReportItem, renderAnomalyItem]);

  // Memoize keyExtractor for unified feed
  const keyExtractor = useCallback((item: FeedItem) => {
    return item.type === 'report' ? `report-${item.data.id}` : `anomaly-${item.data.id}`;
  }, []);

  // Calculate counts for header (memoized to prevent recalculation)
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);
  const ongoingCount = useMemo(() => reports.filter(r => r.status === 'acknowledged').length, [reports]);
  const manualCount = useMemo(() => reports.filter(r => r.reportType === 'manual' || (!r.reportType && !r.audio)).length, [reports]);
  const voiceCount = useMemo(() => reports.filter(r => r.reportType === 'voice' || !!r.audio).length, [reports]);
  const totalCount = reports.length;
  const anomalyCount = useMemo(() => anomalies.filter(a => !a.is_confirmed).length, [anomalies]);
  const soundAnomalyCount = useMemo(() => anomalies.filter(a => a.anomaly_type === 'sound_anomaly').length, [anomalies]);
  const antiTamperingCount = useMemo(() => anomalies.filter(a => a.anomaly_type === 'anti_tampering').length, [anomalies]);

  // Filter anomalies by type and search query
  const displayedAnomalies = useMemo(() => {
    let base = anomalies;
    
    // Apply anomaly type filter
    if (anomalyTypeFilter !== 'all') {
      base = base.filter(a => a.anomaly_type === anomalyTypeFilter);
    }
    
    // Apply search query filter for anomalies
    const q = committedQuery.trim().toLowerCase();
    if (!q) return base;
    
    return base.filter(a => {
      // Search by anomaly type label (e.g., "Sound Anomaly", "Anti-Tampering")
      const typeLabel = a.anomaly_type_label?.toLowerCase() ?? '';
      
      // Search by IoT box name
      const iotBoxName = (a.iot_box?.device_name || a.iot_box?.location_name || a.iot_box?.name || '').toLowerCase();
      
      // Search by location (can be object or string)
      let locationStr = '';
      if (typeof a.location === 'string') {
        locationStr = a.location.toLowerCase();
      } else if (a.location) {
        locationStr = `${a.location.location_name || ''} ${a.location.barangay || ''}`.toLowerCase();
      }
      // Also check display_location from iot_box
      const displayLocation = (a.iot_box?.display_location || a.iot_box?.barangay || '').toLowerCase();
      
      // Search by description
      const description = a.description?.toLowerCase() ?? '';
      
      // Search by device ID
      const deviceId = a.device_id?.toLowerCase() ?? '';
      
      return typeLabel.includes(q) || 
             iotBoxName.includes(q) || 
             locationStr.includes(q) || 
             displayLocation.includes(q) ||
             description.includes(q) ||
             deviceId.includes(q);
    });
  }, [anomalies, anomalyTypeFilter, committedQuery]);
  
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
      // Search by title
      const title = r.title?.toLowerCase() ?? '';
      
      // Search by location
      const location = r.location?.toLowerCase() ?? '';
      
      // Search by description
      const description = r.description?.toLowerCase() ?? '';
      
      // Search by status (pending, ongoing/acknowledged, resolved)
      const status = r.status?.toLowerCase() ?? '';
      // Also allow "ongoing" to match "acknowledged"
      const statusMatch = status.includes(q) || (q === 'ongoing' && status === 'acknowledged');
      
      // Search by severity (low, medium, high, critical)
      const severity = r.severity?.toLowerCase() ?? '';
      
      // Search by category (safety, security, infrastructure, etc.)
      const category = r.originalCategory?.toLowerCase() ?? '';
      
      // Search by report type (manual, voice)
      const reportType = r.reportType?.toLowerCase() ?? '';
      
      // Search by reporter name
      const reportedBy = r.reportedBy?.toLowerCase() ?? '';
      
      // Search by type (accident, crime, fire, medical, etc.)
      const type = r.type?.toLowerCase() ?? '';
      
      // Search by transcript (for voice concerns)
      const transcript = r.transcript?.toLowerCase() ?? '';
      
      return title.includes(q) || 
             location.includes(q) || 
             description.includes(q) ||
             statusMatch ||
             severity.includes(q) ||
             category.includes(q) ||
             reportType.includes(q) ||
             reportedBy.includes(q) ||
             type.includes(q) ||
             transcript.includes(q);
    });
  }, [reports, committedQuery, statusFilter, reportTypeFilter]);

  // Unified feed: Combine reports and anomalies, sorted by timestamp (newest first)
  // Filter based on feedType selection
  const unifiedFeed = useMemo((): FeedItem[] => {
    const reportItems: FeedItem[] = displayedReports.map(report => ({
      type: 'report' as const,
      data: report,
      timestamp: report.timestamp,
    }));

    const anomalyItems: FeedItem[] = displayedAnomalies.map(anomaly => ({
      type: 'anomaly' as const,
      data: anomaly,
      timestamp: new Date(anomaly.created_at),
    }));

    // Filter based on selected feed type
    let items: FeedItem[] = [];
    if (feedType === 'concerns') {
      items = reportItems;
    } else {
      items = anomalyItems;
    }

    // Sort by timestamp (newest first)
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [displayedReports, displayedAnomalies, feedType]);

  // Feed Tab Selector Component - Simple underline style
  const FeedTabSelector = useMemo(() => (
    <View style={styles.feedTabsContainer}>
      {/* Concerns Tab */}
      <TouchableOpacity
        style={[styles.feedTab, feedType === 'concerns' && styles.feedTabActive]}
        onPress={() => setFeedType('concerns')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="warning-outline" 
          size={18} 
          color={feedType === 'concerns' ? colors.primary.blue : '#94a3b8'} 
        />
        <Text style={[styles.feedTabText, feedType === 'concerns' && styles.feedTabTextActive]}>
          Concerns
        </Text>
      </TouchableOpacity>

      {/* Anomalies Tab */}
      <TouchableOpacity
        style={[styles.feedTab, feedType === 'anomalies' && styles.feedTabActive]}
        onPress={() => setFeedType('anomalies')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="radio-outline" 
          size={18} 
          color={feedType === 'anomalies' ? colors.primary.blue : '#94a3b8'} 
        />
        <Text style={[styles.feedTabText, feedType === 'anomalies' && styles.feedTabTextActive]}>
          Anomalies
        </Text>
      </TouchableOpacity>
    </View>
  ), [feedType]);
  
  // Memoize header component - only recompute when dependencies change
  const memoizedHeader = useMemo(() => {
    return (
      <>
        <IncidentHeader
          statusFilter={statusFilter}
          reportTypeFilter={reportTypeFilter}
          pendingCount={pendingCount}
          acknowledgedCount={ongoingCount}
          resolvedCount={resolvedCount}
          displayedCount={totalCount} // Total of all concerns assigned to purok
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          committedQuery={committedQuery}
          setCommittedQuery={setCommittedQuery}
          onFilterPress={() => setIsFilterModalVisible(true)}
          setStatusFilter={setStatusFilter}
          setReportTypeFilter={setReportTypeFilter}
        />
        {FeedTabSelector}
      </>
    );
  }, [pendingCount, ongoingCount, resolvedCount, totalCount, statusFilter, reportTypeFilter, searchQuery, committedQuery, FeedTabSelector]);

  // Combined loading state
  const isLoading = loading || anomaliesLoading;

  // Handle unified refresh
  const handleUnifiedRefresh = useCallback(async () => {
    await Promise.all([
      handleRefresh('all'),
      refreshAnomalies(),
    ]);
  }, [handleRefresh, refreshAnomalies]);

  return (
    <View style={globalStyles.container}>
      {/* Unified Feed - Reports + Anomalies */}
      <FlatList
        data={unifiedFeed}
        keyExtractor={keyExtractor}
        renderItem={renderFeedItem}
        ListHeaderComponent={memoizedHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleUnifiedRefresh}
            tintColor={colors.primary.blue}
          />
        }
        ListEmptyComponent={
          isLoading
            ? <ReportCardSkeleton count={4} />
            : <EmptyState loading={false} feedType={feedType} />
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
      {/* Key ensures re-render when unreadCount changes */}
      <DraggableNotificationBell key={`bell-${unreadCount}`} unreadCount={unreadCount} />

      {/* Filter Modal - Lazy loaded */}
      {isFilterModalVisible && (
        <Suspense fallback={null}>
          <FilterModal
            visible={isFilterModalVisible}
            statusFilter={statusFilter}
            reportTypeFilter={reportTypeFilter}
            anomalyTypeFilter={anomalyTypeFilter}
            feedType={feedType}
            totalCount={totalCount}
            pendingCount={pendingCount}
            ongoingCount={ongoingCount}
            resolvedCount={resolvedCount}
            manualCount={manualCount}
            voiceCount={voiceCount}
            anomalyCount={anomalies.length}
            soundAnomalyCount={soundAnomalyCount}
            antiTamperingCount={antiTamperingCount}
            onStatusFilterChange={setStatusFilter}
            onReportTypeFilterChange={setReportTypeFilter}
            onAnomalyTypeFilterChange={setAnomalyTypeFilter}
            onFeedTypeChange={setFeedType}
            onClose={() => setIsFilterModalVisible(false)}
            onClearAll={() => {
              setStatusFilter('all');
              setReportTypeFilter('all');
              setAnomalyTypeFilter('all');
              setFeedType('concerns');
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

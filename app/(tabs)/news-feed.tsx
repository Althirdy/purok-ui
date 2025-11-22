/**
 * News Feed Screen - Main Dashboard for Purok Officials
 */

import { Toast, type ToastData } from '@/components/common/toast';
import { ReportCard } from '@/components/news/report-card';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { MAX_REPORTS_LIMIT } from '@/constants/sensor-config';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { anomalyToReport, deviceStatusToReport, fetchLatestAnomaliesSince, fetchLatestDeviceStatusSince, listenToAnomalies } from '@/services/firebase-service';
import type { EmergencyReport, FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REPORTS_STORAGE_KEY = '@urbanwatch:reports';

// Inline styles to avoid .styles.ts files being treated as routes
const { colors, typography, spacing, shadows } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
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
    width: isTablet ? 56 : 36,
    height: isTablet ? 56 : 36,
    borderRadius: isTablet ? 28 : 18,
    backgroundColor: colors.neutral.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  headerWelcome: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.85,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: isTablet ? 48 : 32,
    height: isTablet ? 48 : 32,
    borderRadius: isTablet ? 24 : 16,
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
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
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
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
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
    borderRadius: 20,
    padding: spacing.md,
    ...shadows.sm,
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
  const { sessionStartMs, user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedSource>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [showAckModal, setShowAckModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newReportCount, setNewReportCount] = useState(0);
  const [toast, setToast] = useState<ToastData | null>(null);
  const { addNotificationFromReport, addNotification, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  
  // Debounce live search so it filters shortly after typing
  useEffect(() => {
    const handle = setTimeout(() => {
      setCommittedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Performance optimization: Track processed IDs and batch updates
  const processedReportIds = useRef<Set<string>>(new Set());
  const pendingReports = useRef<EmergencyReport[]>([]);
  const updateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const immediateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdating = useRef(false);
  // Use standardized constants from sensor-config
  const MAX_REPORTS = MAX_REPORTS_LIMIT;
  // Use a shorter interval on mobile for a snappier experience
  const DATA_PROCESSING_INTERVAL = 2000; // 2 seconds

  // Bottom sheet animation
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

  const presentSheet = useCallback((reportId?: string) => {
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
  }, [slideAnim]);

  const dismissSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowAckModal(false);
      setSelectedReportId(null);
    });
  }, [slideAnim]);

  // Fetch reports by source (limited to a single mock item for now)
  const fetchReports = async (source: FeedSource) => {
    setLoading(true);
    try {
      // Try to fetch from Firebase first
      let sensorReports: EmergencyReport[] = [];
      
      if (source === 'all' || source === 'sensor_box') {
        try {
          const sensorData = await fetchLatestAnomaliesSince(sessionStartMs, 40);
          sensorReports = sensorData.map(data => anomalyToReport(data));
        } catch (error) {
          console.warn('Error fetching sensor data:', error);
        }

        // Device status (overheat/health) → reports
        try {
          const dev = await fetchLatestDeviceStatusSince(sessionStartMs, 12);
          const devReports = dev
            .map(deviceStatusToReport)
            .filter((r): r is NonNullable<typeof r> => !!r);
          sensorReports = [...sensorReports, ...devReports];
        } catch (err) {
          console.warn('Error fetching device status:', err);
        }
      }

      // Combine only sensor/device reports (no mock fallback)
      const allReports = [...sensorReports];
      
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
      
      // Remove duplicates and limit to MAX_REPORTS
      const uniqueReports = filteredReports.filter((report, index, self) =>
        index === self.findIndex(r => r.id === report.id)
      );
      const limitedReports = uniqueReports.slice(0, MAX_REPORTS);
      
      // Add to processed set to prevent listener duplicates
      limitedReports.forEach(report => {
        processedReportIds.current.add(report.id);
      });
      
      // Merge with existing reports, preserving status
      setReports(prevReports => {
        if (prevReports.length === 0) {
          return limitedReports;
        }
        const existingMap = new Map(prevReports.map(r => [r.id, r]));
        const freshMap = new Map(limitedReports.map(r => [r.id, r]));
        
        // Merge: use existing status if report exists, otherwise use fresh
        const merged = limitedReports.map(fresh => {
          const existing = existingMap.get(fresh.id);
          if (existing) {
            return { ...fresh, status: existing.status };
          }
          return fresh;
        });

        // Add any existing reports that aren't in fresh (older reports)
        existingMap.forEach((existing, id) => {
          if (!freshMap.has(id)) {
            merged.push(existing);
          }
        });

        const sorted = merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return sorted.slice(0, MAX_REPORTS);
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportPress = useCallback((reportId: string) => {
    router.push({ pathname: 'report-details', params: { reportId } } as any);
  }, []);

  // Memoize acknowledge handler to prevent re-renders
  type SheetMode = 'ack' | 'resolve';
  const [sheetMode, setSheetMode] = useState<SheetMode>('ack');
  const handleAcknowledgePress = useCallback((reportId: string) => {
    setSheetMode('ack');
    presentSheet(reportId);
  }, [presentSheet]);

  const handleResolvePress = useCallback((reportId: string) => {
    // Confirm before resolving
    // Using a lightweight confirm modal via Alert
    setSheetMode('resolve');
    presentSheet(reportId);
  }, []);

  const handleActionPress = useCallback((reportId: string) => {
    const r = reports.find(x => x.id === reportId);
    if (!r) return;
    if (r.status === 'pending') return handleAcknowledgePress(reportId);
    if (r.status === 'acknowledged') return handleResolvePress(reportId);
  }, [reports, handleAcknowledgePress, handleResolvePress]);

  // Optimized renderItem with memoized callbacks
  const renderReportItem = useCallback(({ item }: { item: EmergencyReport }) => {
    return (
      <ReportCard
        report={item}
        onPress={item.status === 'pending' ? handleReportPress : undefined}
        onAcknowledge={item.status !== 'resolved' ? handleActionPress : undefined}
      />
    );
  }, [handleReportPress, handleActionPress]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: EmergencyReport) => item.id, []);

  // Calculate counts for header (memoized to prevent recalculation)
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending').length, [reports]);
  const acknowledgedCount = useMemo(() => reports.filter(r => r.status === 'acknowledged').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);
  
  // Derived: reports filtered by search query
  const displayedReports = useMemo(() => {
    const q = committedQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(r => {
      const title = r.title?.toLowerCase() ?? '';
      const location = r.location?.toLowerCase() ?? '';
      return title.includes(q) || location.includes(q);
    });
  }, [reports, committedQuery]);
  
  // Memoize header component - only recompute when dependencies change
  const memoizedHeader = useMemo(() => {
    return renderHeader();
  }, [activeFilter, pendingCount, acknowledgedCount, newReportCount, unreadCount, searchQuery, committedQuery]);

  // Batch process pending reports (throttled to prevent lag)
  const processPendingReports = useCallback(() => {
    if (isUpdating.current) return;
    const next = pendingReports.current.shift();
    if (!next) return;

    // Skip if already processed or exists
    if (processedReportIds.current.has(next.id)) {
      return;
    }
    isUpdating.current = true;
    processedReportIds.current.add(next.id);

    setReports(prev => {
      if (prev.some(r => r.id === next.id)) {
        isUpdating.current = false;
        return prev;
      }
      const updated = [next, ...prev].slice(0, MAX_REPORTS);
      setNewReportCount(p => p + 1);

      // Defer notifications to avoid state updates during render
      setTimeout(() => {
        addNotificationFromReport(next);
        if ((next.severity === 'critical' || next.severity === 'high') && !toast) {
          setToast({
            id: `toast-${next.id}-${Date.now()}`,
            title: next.severity === 'critical' ? '🚨 Critical Alert' : '⚠️ Alert',
            message: next.title,
            severity: next.severity,
            reportType: next.type,
            onPress: () => handleReportPress(next.id),
          });
        }
        isUpdating.current = false;
      }, 0);

      return updated;
    });
  }, [handleReportPress, toast, addNotificationFromReport]);

  // Set up Firebase real-time listener for sensor data with throttling
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = listenToAnomalies((sensorData, report) => {
        // Skip if already processed
        if (processedReportIds.current.has(report.id)) {
          return;
        }

        // Add to pending queue
        pendingReports.current.push(report);

        // Schedule an immediate, lightweight drain soon after each item arrives
        if (immediateTimer.current) {
          clearTimeout(immediateTimer.current);
        }
        immediateTimer.current = setTimeout(() => {
          processPendingReports();
          immediateTimer.current = null;
        }, 300); // small debounce for bursts
      });

      // Set up interval to process pending reports every 30 seconds (standardized interval)
      // This ensures we only process incoming data at fixed 30-second intervals
      // All incoming sensor data is batched and processed together to prevent UI lag
      updateTimer.current = setInterval(() => {
        processPendingReports();
      }, DATA_PROCESSING_INTERVAL);
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
    }

    // Cleanup on unmount
    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
      if (immediateTimer.current) {
        clearTimeout(immediateTimer.current);
        immediateTimer.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
      processedReportIds.current.clear();
      pendingReports.current = [];
    };
  }, [handleReportPress, processPendingReports, addNotificationFromReport]);

  // Load cached reports on mount
  useEffect(() => {
    const loadCachedReports = async () => {
      try {
        const cached = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Convert timestamp strings back to Date objects
          const withDates = parsed.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          }));
          setReports(withDates);
          // Mark as processed to avoid duplicates
          withDates.forEach((r: EmergencyReport) => {
            processedReportIds.current.add(r.id);
          });
        }
      } catch (error) {
        console.error('Error loading cached reports:', error);
      }
    };
    loadCachedReports();
    fetchReports(activeFilter);
  }, [activeFilter]);

  // Save reports to cache whenever they change
  useEffect(() => {
    const saveReports = async () => {
      try {
        // Limit to last 100 reports to prevent storage bloat
        const toSave = reports.slice(0, 100);
        await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving reports:', error);
      }
    };
    if (reports.length > 0) {
      saveReports();
    }
  }, [reports]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setNewReportCount(0); // Reset new report count on refresh
    // Don't clear processedReportIds - keep existing reports
    pendingReports.current = []; // Clear pending
    
    // Restart the interval after refresh
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
    }
    updateTimer.current = setInterval(() => {
      processPendingReports();
    }, DATA_PROCESSING_INTERVAL);
    
    try {
      // Fetch fresh reports and merge with existing (preserving status)
      const freshReports = await (async () => {
        let sensorReports: EmergencyReport[] = [];
        
        if (activeFilter === 'all' || activeFilter === 'sensor_box') {
          try {
            const sensorData = await fetchLatestAnomaliesSince(sessionStartMs, 40);
            sensorReports = sensorData.map(data => anomalyToReport(data));
          } catch (error) {
            console.warn('Error fetching sensor data:', error);
          }

          try {
            const dev = await fetchLatestDeviceStatusSince(sessionStartMs, 12);
            const devReports = dev
              .map(deviceStatusToReport)
              .filter((r): r is NonNullable<typeof r> => !!r);
            sensorReports = [...sensorReports, ...devReports];
          } catch (err) {
            console.warn('Error fetching device status:', err);
          }
        }

        const allReports = [...sensorReports];
        const filteredReports = activeFilter === 'all' 
          ? allReports 
          : allReports.filter(r => {
              if (activeFilter === 'sensor_box') return r.source === 'sensor';
              if (activeFilter === 'cctv') return r.source === 'cctv';
              if (activeFilter === 'citizen_reports') return r.source === 'citizen';
              return true;
            });

        filteredReports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const uniqueReports = filteredReports.filter((report, index, self) =>
          index === self.findIndex(r => r.id === report.id)
        );
        return uniqueReports.slice(0, MAX_REPORTS);
      })();

      // Merge with existing reports, preserving status from existing reports
      setReports(prevReports => {
        const existingMap = new Map(prevReports.map(r => [r.id, r]));
        const freshMap = new Map(freshReports.map(r => [r.id, r]));
        
        // Merge: use existing status if report exists, otherwise use fresh
        const merged = freshReports.map(fresh => {
          const existing = existingMap.get(fresh.id);
          if (existing) {
            // Preserve status from existing report
            return { ...fresh, status: existing.status };
          }
          return fresh;
        });

        // Add any existing reports that aren't in fresh (older reports)
        existingMap.forEach((existing, id) => {
          if (!freshMap.has(id)) {
            merged.push(existing);
          }
        });

        const sorted = merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return sorted.slice(0, MAX_REPORTS);
      });
    } finally {
      setRefreshing(false);
    }
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
    if (sheetMode === 'ack') {
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === selectedReportId
            ? { ...report, status: 'acknowledged' as const }
            : report
        )
      );
      const r = reports.find(r => r.id === selectedReportId);
      if (r) {
        addNotification({
          id: `update-${r.id}-${Date.now()}`,
          type: 'report_update',
          title: 'Report Acknowledged',
          message: r.title,
          reportId: r.id,
          timestamp: new Date(),
          read: false,
        });
      }
    } else {
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === selectedReportId
            ? { ...report, status: 'resolved' as const }
            : report
        )
      );
      const r = reports.find(r => r.id === selectedReportId);
      if (r) {
        addNotification({
          id: `update-${r.id}-${Date.now()}`,
          type: 'report_update',
          title: 'Report Resolved',
          message: r.title,
          reportId: r.id,
          timestamp: new Date(),
          read: false,
        });
      }
    }
    dismissSheet();
  };

  // Manual reporting removed

  function renderHeader() {
    const name = (user?.name || '').trim();
    const parts = name.split(/\s+/);
    const displayName = parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : (name || 'Purok Leader');
    return (
    <View style={styles.headerWrapper}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Ionicons name="shield" size={isTablet ? 24 : 18} color={colors.primary.blue} />
            </View>
            <View>
              <Text style={styles.headerTitle}>UrbanWatch</Text>
              <Text style={styles.headerSubtitle}>Purok Feed</Text>
              <Text style={styles.headerWelcome}>Welcome, {displayName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/notifications' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={isTablet ? 24 : 20} color={colors.text.inverse} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Utilities: Search + Stats */}
      <View style={styles.utilities}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => setCommittedQuery(searchQuery.trim())} activeOpacity={0.7}>
            <Ionicons name="search" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchText}
            placeholder="Search incidents"
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode={isIOS ? 'while-editing' : 'never'}
            onSubmitEditing={() => setCommittedQuery(searchQuery.trim())}
          />
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ack'd</Text>
            <Text style={styles.statValue}>{acknowledgedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={styles.statValue}>{resolvedCount}</Text>
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
  }

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
        // Performance optimizations for rapid data
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        // Note: getItemLayout removed - items have variable heights based on content
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
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
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
              {selectedReportId ? (reports.find(r => r.id === selectedReportId)?.title ?? 'Report') : 'Report'}
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

            {/* Actions: Acknowledge / Resolve */}
            <View style={{ marginTop: spacing.lg }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={confirmAcknowledge}
                style={{ backgroundColor: sheetMode === 'ack' ? colors.primary.blue : colors.semantic.success, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', ...shadows.sm }}
              >
                <Text style={{ color: sheetMode === 'ack' ? colors.text.inverse : colors.text.primary, fontWeight: typography.fontWeight.semibold }}>
                  {sheetMode === 'ack' ? 'Acknowledge' : 'Resolve'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Modern Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} duration={5000} />
    </SafeAreaView>
  );
}

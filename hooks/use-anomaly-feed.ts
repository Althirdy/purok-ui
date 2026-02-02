/**
 * Anomaly Feed Hook - Manages fetching, real-time updates, and status changes for IoT anomalies
 */

import { useAuth } from '@/context/auth-context';
import {
    confirmAnomaly,
    dismissAnomaly,
    fetchAnomalyLogs,
    fetchAnomalyStatistics
} from '@/services/anomaly-service';
import { subscribeToAnomalyLogs, type AnomalyCreatedPayload } from '@/services/realtime-service';
import type {
    AnomalyFilter,
    AnomalyLog,
    AnomalyLogsQueryParams,
    AnomalyStatistics,
    AnomalyType,
    PaginationMeta,
} from '@/types/anomaly';
import { useCallback, useEffect, useRef, useState } from 'react';

// Helper to safely trigger push notification
const tryScheduleNotification = async (title: string, body: string, data?: Record<string, any>) => {
  try {
    const { scheduleNotification } = await import('@/services/notifications');
    await scheduleNotification(title, body, data);
  } catch (error) {
    console.log('[AnomalyFeed] Push notification skipped (Expo Go)');
  }
};

interface UseAnomalyFeedOptions {
  /** Callback when a new anomaly is received via WebSocket */
  onNewAnomaly?: (anomaly: AnomalyCreatedPayload) => void;
  /** Whether to enable real-time subscriptions (default: true) */
  enableRealtime?: boolean;
  /** Default items per page (default: 15) */
  perPage?: number;
}

interface UseAnomalyFeedReturn {
  // Data
  anomalies: AnomalyLog[];
  statistics: AnomalyStatistics | null;
  pagination: PaginationMeta | null;
  
  // State
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  statisticsLoading: boolean;
  
  // Actions
  fetchAnomalies: (filter?: AnomalyFilter, page?: number) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  refreshAnomalies: (filter?: AnomalyFilter) => Promise<void>;
  loadMoreAnomalies: (filter?: AnomalyFilter) => Promise<void>;
  confirmAnomalyById: (id: number) => Promise<boolean>;
  dismissAnomalyById: (id: number) => Promise<boolean>;
  
  // Filter
  currentFilter: AnomalyFilter;
  setFilter: (filter: AnomalyFilter) => void;
  
  // Utility
  pendingCount: number;
  hasMore: boolean;
}

export function useAnomalyFeed(options: UseAnomalyFeedOptions = {}): UseAnomalyFeedReturn {
  const { onNewAnomaly, enableRealtime = true, perPage = 15 } = options;
  const { accessToken } = useAuth();
  
  // State
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
  const [statistics, setStatistics] = useState<AnomalyStatistics | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<AnomalyFilter>({});
  
  // Refs
  const onNewAnomalyRef = useRef(onNewAnomaly);
  const processedAnomalyIds = useRef<Set<number>>(new Set());
  
  // Update ref when callback changes
  useEffect(() => {
    onNewAnomalyRef.current = onNewAnomaly;
  }, [onNewAnomaly]);
  
  // Convert filter to query params
  const filterToParams = useCallback((filter: AnomalyFilter): AnomalyLogsQueryParams => {
    const params: AnomalyLogsQueryParams = { per_page: perPage };
    
    if (filter.type && filter.type !== 'all') {
      params.anomaly_type = filter.type as AnomalyType;
    }
    if (filter.status === 'pending') {
      params.is_confirmed = false;
    } else if (filter.status === 'confirmed') {
      params.is_confirmed = true;
    }
    if (filter.iotBoxId) {
      params.iot_box_id = filter.iotBoxId;
    }
    
    return params;
  }, [perPage]);
  
  // Fetch anomalies
  const fetchAnomalies = useCallback(async (filter: AnomalyFilter = currentFilter, page: number = 1) => {
    if (!accessToken) {
      console.log('[AnomalyFeed] No access token, skipping fetch');
      setLoading(false);
      return;
    }
    
    try {
      if (page === 1) {
        setLoading(true);
      }
      
      const params = filterToParams(filter);
      params.page = page;
      
      console.log('[AnomalyFeed] Fetching anomalies with params:', params);
      
      const response = await fetchAnomalyLogs(accessToken, params);
      
      if (page === 1) {
        setAnomalies(response.data);
        processedAnomalyIds.current = new Set(response.data.map(a => a.id));
      } else {
        setAnomalies(prev => {
          const newAnomalies = response.data.filter(a => !processedAnomalyIds.current.has(a.id));
          newAnomalies.forEach(a => processedAnomalyIds.current.add(a.id));
          return [...prev, ...newAnomalies];
        });
      }
      
      setPagination(response.meta);
      console.log('[AnomalyFeed] Fetched', response.data.length, 'anomalies');
    } catch (error) {
      console.error('[AnomalyFeed] Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentFilter, filterToParams]);
  
  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!accessToken) {
      console.log('[AnomalyFeed] No access token, skipping statistics fetch');
      return;
    }
    
    try {
      setStatisticsLoading(true);
      const stats = await fetchAnomalyStatistics(accessToken);
      setStatistics(stats);
      console.log('[AnomalyFeed] Fetched statistics:', stats.total.today, 'today');
    } catch (error) {
      console.error('[AnomalyFeed] Error fetching statistics:', error);
    } finally {
      setStatisticsLoading(false);
    }
  }, [accessToken]);
  
  // Refresh anomalies (pull-to-refresh)
  const refreshAnomalies = useCallback(async (filter: AnomalyFilter = currentFilter) => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAnomalies(filter, 1),
        fetchStatistics(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnomalies, fetchStatistics, currentFilter]);
  
  // Load more anomalies (pagination)
  const loadMoreAnomalies = useCallback(async (filter: AnomalyFilter = currentFilter) => {
    if (!pagination || pagination.current_page >= pagination.last_page || loadingMore) {
      return;
    }
    
    setLoadingMore(true);
    try {
      await fetchAnomalies(filter, pagination.current_page + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination, loadingMore, fetchAnomalies, currentFilter]);
  
  // Confirm anomaly
  const confirmAnomalyById = useCallback(async (id: number): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      console.log('[AnomalyFeed] Confirming anomaly:', id);
      const updatedAnomaly = await confirmAnomaly(accessToken, id);
      
      // Update local state
      setAnomalies(prev => 
        prev.map(a => a.id === id ? { ...a, is_confirmed: true, ...updatedAnomaly } : a)
      );
      
      // Refresh statistics
      await fetchStatistics();
      
      console.log('[AnomalyFeed] ✅ Anomaly confirmed:', id);
      return true;
    } catch (error) {
      console.error('[AnomalyFeed] Error confirming anomaly:', error);
      return false;
    }
  }, [accessToken, fetchStatistics]);
  
  // Dismiss anomaly
  const dismissAnomalyById = useCallback(async (id: number): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      console.log('[AnomalyFeed] Dismissing anomaly:', id);
      const updatedAnomaly = await dismissAnomaly(accessToken, id);
      
      // Update local state (could also remove it depending on UX)
      setAnomalies(prev => 
        prev.map(a => a.id === id ? { ...a, is_confirmed: false, ...updatedAnomaly } : a)
      );
      
      // Refresh statistics
      await fetchStatistics();
      
      console.log('[AnomalyFeed] ✅ Anomaly dismissed:', id);
      return true;
    } catch (error) {
      console.error('[AnomalyFeed] Error dismissing anomaly:', error);
      return false;
    }
  }, [accessToken, fetchStatistics]);
  
  // Set filter and refetch
  const setFilter = useCallback((filter: AnomalyFilter) => {
    setCurrentFilter(filter);
    fetchAnomalies(filter, 1);
  }, [fetchAnomalies]);
  
  // Initial fetch
  useEffect(() => {
    if (accessToken) {
      fetchAnomalies(currentFilter, 1);
      fetchStatistics();
    }
  }, [accessToken]); // Only run on mount / token change
  
  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;
    
    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      unsubscribe = await subscribeToAnomalyLogs((anomaly) => {
        // Check if already processed
        if (processedAnomalyIds.current.has(anomaly.id)) {
          console.log('[AnomalyFeed] Anomaly already processed:', anomaly.id);
          return;
        }
        
        processedAnomalyIds.current.add(anomaly.id);
        console.log('[AnomalyFeed] 🚨 New anomaly received:', anomaly.id);
        
        // Add to list (prepend for newest first)
        const newAnomalyLog: AnomalyLog = {
          id: anomaly.id,
          anomaly_type: anomaly.anomaly_type,
          anomaly_type_label: anomaly.anomaly_type_label,
          iot_box_id: anomaly.iot_box.id,
          iot_box: anomaly.iot_box,
          is_confirmed: false,
          location: anomaly.location || anomaly.iot_box.location,
          created_at: anomaly.created_at,
        };
        
        setAnomalies(prev => [newAnomalyLog, ...prev]);
        
        // Update statistics (increment pending)
        setStatistics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            total: {
              ...prev.total,
              today: prev.total.today + 1,
              all_time: prev.total.all_time + 1,
            },
            by_status: {
              ...prev.by_status,
              pending: prev.by_status.pending + 1,
            },
            by_type: {
              ...prev.by_type,
              [anomaly.anomaly_type]: (prev.by_type[anomaly.anomaly_type] || 0) + 1,
            },
          };
        });
        
        // Trigger push notification
        tryScheduleNotification(
          `🚨 ${anomaly.anomaly_type_label}`,
          `Detected at ${anomaly.iot_box.name || anomaly.location || 'Unknown location'}`,
          { anomalyId: anomaly.id }
        );
        
        // Call custom callback
        onNewAnomalyRef.current?.(anomaly);
      });
    };
    
    setupSubscription();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enableRealtime]);
  
  // Computed values
  const pendingCount = statistics?.by_status.pending ?? 0;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;
  
  return {
    // Data
    anomalies,
    statistics,
    pagination,
    
    // State
    loading,
    refreshing,
    loadingMore,
    statisticsLoading,
    
    // Actions
    fetchAnomalies,
    fetchStatistics,
    refreshAnomalies,
    loadMoreAnomalies,
    confirmAnomalyById,
    dismissAnomalyById,
    
    // Filter
    currentFilter,
    setFilter,
    
    // Utility
    pendingCount,
    hasMore,
  };
}

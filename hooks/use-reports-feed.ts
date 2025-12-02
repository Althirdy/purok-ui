import { MAX_REPORTS_LIMIT } from '@/constants/sensor-config';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { anomalyToReport, deviceStatusToReport, fetchLatestAnomaliesSince, fetchLatestDeviceStatusSince, listenToAnomalies } from '@/services/firebase-service';
import { subscribeToCitizenReports } from '@/services/realtime-service';
import type { EmergencyReport, FeedSource } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const REPORTS_STORAGE_KEY = '@urbanwatch:reports';
const DATA_PROCESSING_INTERVAL = 2000; // 2 seconds

interface UseReportsFeedOptions {
  onNewReport?: (report: EmergencyReport) => void;
  onToastRequest?: (toast: any) => void;
}

export function useReportsFeed(options: UseReportsFeedOptions = {}) {
  const { sessionStartMs } = useAuth();
  const { addNotificationFromReport } = useNotifications();
  const { onNewReport, onToastRequest } = options;

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);

  // Performance optimization: Track processed IDs and batch updates
  const processedReportIds = useRef<Set<string>>(new Set());
  const pendingReports = useRef<EmergencyReport[]>([]);
  const updateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const immediateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdating = useRef(false);
  const MAX_REPORTS = MAX_REPORTS_LIMIT;

  // Fetch sensor reports by source
  const fetchSensorReports = useCallback(async (source: FeedSource): Promise<EmergencyReport[]> => {
    let sensorReports: EmergencyReport[] = [];

    if (source === 'all' || source === 'sensor_box') {
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
    return uniqueReports.slice(0, MAX_REPORTS);
  }, [sessionStartMs]);

  // Merge reports preserving status
  const mergeReports = useCallback((freshReports: EmergencyReport[]) => {
    setReports(prevReports => {
      if (prevReports.length === 0) {
        return freshReports;
      }
      const existingMap = new Map(prevReports.map(r => [r.id, r]));
      const freshMap = new Map(freshReports.map(r => [r.id, r]));

      // Merge: use existing status if report exists, otherwise use fresh
      const merged = freshReports.map(fresh => {
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
  }, [MAX_REPORTS]);

  // Fetch reports by source
  const fetchReports = useCallback(async (source: FeedSource) => {
    setLoading(true);
    try {
      const freshReports = await fetchSensorReports(source);

      // Add to processed set to prevent listener duplicates
      freshReports.forEach(report => {
        processedReportIds.current.add(report.id);
      });

      mergeReports(freshReports);
    } finally {
      setLoading(false);
    }
  }, [fetchSensorReports, mergeReports]);

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
        onNewReport?.(next);
        isUpdating.current = false;
      }, 0);

      return updated;
    });
  }, [addNotificationFromReport, onNewReport, MAX_REPORTS]);

  // Set up Firebase real-time listener for sensor data with throttling
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let unsubscribeCitizen: (() => void) | null = null;

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

      // Citizen channel subscription (Pusher)
      unsubscribeCitizen = subscribeToCitizenReports(report => {
        if (processedReportIds.current.has(report.id)) {
          return;
        }
        processedReportIds.current.add(report.id);
        setReports(prev => {
          if (prev.some(r => r.id === report.id)) {
            return prev;
          }
          return [report, ...prev].slice(0, MAX_REPORTS);
        });
        setNewReportCount(p => p + 1);
      });

      // Set up interval to process pending reports
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
      if (unsubscribeCitizen) {
        unsubscribeCitizen();
      }
      processedReportIds.current.clear();
      pendingReports.current = [];
    };
  }, [processPendingReports]);

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
  }, []);

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

  // Refresh reports
  const handleRefresh = useCallback(async (source: FeedSource) => {
    setRefreshing(true);
    setNewReportCount(0);
    pendingReports.current = [];

    // Restart the interval after refresh
    if (updateTimer.current) {
      clearInterval(updateTimer.current);
    }
    updateTimer.current = setInterval(() => {
      processPendingReports();
    }, DATA_PROCESSING_INTERVAL);

    try {
      const freshReports = await fetchSensorReports(source);
      mergeReports(freshReports);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSensorReports, mergeReports, processPendingReports]);

  // Update report status
  const updateReportStatus = useCallback((reportId: string, status: EmergencyReport['status']) => {
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId ? { ...report, status } : report
      )
    );
  }, []);

  return {
    reports,
    loading,
    refreshing,
    newReportCount,
    fetchReports,
    handleRefresh,
    updateReportStatus,
  };
}


/**
 * Reports Feed Hook - Manages fetching, real-time updates, and status changes for emergency reports
 */

import { useNotifications } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';
import type { EmergencyReport, FeedSource } from '@/types';
import { fetchAssignedConcerns, updateAssignedConcernStatus } from '@/services/purok-leader-service';
import { subscribeToCitizenReports } from '@/services/realtime-service';
import { fetchLatestAnomaliesSince, listenToAnomalies, anomalyToReport } from '@/services/firebase-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseReportsFeedOptions {
  onNewReport?: (report: EmergencyReport) => void;
}

interface UseReportsFeedReturn {
  reports: EmergencyReport[];
  loading: boolean;
  refreshing: boolean;
  fetchReports: (source: FeedSource) => Promise<void>;
  handleRefresh: (source: FeedSource) => Promise<void>;
  updateReportStatus: (reportId: string, status: EmergencyReport['status']) => Promise<void>;
}

export function useReportsFeed(options: UseReportsFeedOptions = {}): UseReportsFeedReturn {
  const { onNewReport } = options;
  const { user, accessToken, sessionStartMs } = useAuth();
  const { addNotificationFromReport } = useNotifications();

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs to prevent unnecessary re-subscriptions
  const onNewReportRef = useRef(onNewReport);
  const addNotificationFromReportRef = useRef(addNotificationFromReport);
  const processedReportIds = useRef<Set<string>>(new Set());
  const notifiedReportIds = useRef<Set<string>>(new Set());
  const syncInProgressRef = useRef(false);
  const pusherSubscriptionRef = useRef<(() => void) | null>(null);
  const firebaseUnsubscribeRef = useRef<(() => void) | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onNewReportRef.current = onNewReport;
    addNotificationFromReportRef.current = addNotificationFromReport;
  }, [onNewReport, addNotificationFromReport]);

  // Fetch reports from all sources
  const fetchReports = useCallback(async (source: FeedSource) => {
    try {
      setLoading(true);
      const allReports: EmergencyReport[] = [];

      // Fetch Firebase sensor data
      try {
        const sensorDataList = await fetchLatestAnomaliesSince(sessionStartMs, 40);
        const sensorReports = sensorDataList.map(anomalyToReport);
        allReports.push(...sensorReports);
        console.log('[ReportsFeed] Fetched sensor reports:', sensorReports.length);
      } catch (error) {
        console.error('[ReportsFeed] Error fetching sensor data:', error);
      }

      // Fetch assigned concerns from API (if authenticated)
      if (accessToken && user?.id) {
        try {
          const concerns = await fetchAssignedConcerns(accessToken);
          allReports.push(...concerns);
          console.log('[ReportsFeed] Fetched assigned concerns:', concerns.length);
        } catch (error) {
          console.error('[ReportsFeed] Error fetching assigned concerns:', error);
        }
      }

      // Remove duplicates and sort by timestamp (newest first)
      const uniqueReports = Array.from(
        new Map(allReports.map(r => [r.id, r])).values()
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setReports(uniqueReports);
      processedReportIds.current = new Set(uniqueReports.map(r => r.id));
      console.log('[ReportsFeed] Total reports loaded:', uniqueReports.length);
    } catch (error) {
      console.error('[ReportsFeed] Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, user?.id, sessionStartMs]);

  // Handle refresh (same as fetch but with refreshing state)
  const handleRefresh = useCallback(async (source: FeedSource) => {
    setRefreshing(true);
    try {
      await fetchReports(source);
    } finally {
      setRefreshing(false);
    }
  }, [fetchReports]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Firebase listener for sensor data
    const firebaseUnsubscribe = listenToAnomalies((sensorData, report) => {
      if (processedReportIds.current.has(report.id)) {
        return; // Skip if already processed
      }
      processedReportIds.current.add(report.id);
      console.log('[ReportsFeed] New sensor report:', report.id);
      setReports(prev => [report, ...prev]);
      addNotificationFromReportRef.current(report);
      onNewReportRef.current?.(report);
    });
    firebaseUnsubscribeRef.current = firebaseUnsubscribe;

    // Pusher subscription for citizen reports
    let syncTimer: ReturnType<typeof setInterval> | null = null;
    
    if (accessToken) {
      let unsubscribePusher: (() => void) | null = null;
      
      subscribeToCitizenReports(
        user.id,
        accessToken,
        (report) => {
          if (processedReportIds.current.has(report.id)) {
            console.log('[ReportsFeed] Report already processed:', report.id);
            return;
          }
          processedReportIds.current.add(report.id);
          console.log('[ReportsFeed] New citizen report from Pusher:', report.id);

          // Add notification (only once per report)
          if (!notifiedReportIds.current.has(report.id)) {
            notifiedReportIds.current.add(report.id);
            addNotificationFromReportRef.current(report);
            console.log('[ReportsFeed] Added notification for report:', report.id);
          }

          // Add to reports list
          setReports(prev => {
            // Check if report already exists
            if (prev.some(r => r.id === report.id)) {
              return prev;
            }
            return [report, ...prev];
          });

          // Trigger toast notification callback
          if (onNewReportRef.current) {
            onNewReportRef.current(report);
          }
        }
      ).then((unsubscribe) => {
        unsubscribePusher = unsubscribe;
        pusherSubscriptionRef.current = unsubscribe;
      }).catch((error) => {
        console.error('[ReportsFeed] Error subscribing to Pusher:', error);
      });

      // Initial sync for missed reports (2 seconds after subscription)
      const syncMissedReports = async () => {
        if (syncInProgressRef.current) {
          console.log('[ReportsFeed] Sync already in progress, skipping...');
          return;
        }
        try {
          syncInProgressRef.current = true;
          console.log('[ReportsFeed] Syncing missed reports...');
          const concerns = await fetchAssignedConcerns(accessToken);
          
          setReports(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newReports = concerns.filter(r => !existingIds.has(r.id));
            if (newReports.length > 0) {
              console.log('[ReportsFeed] Found', newReports.length, 'missed reports');
              return [...newReports, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            }
            return prev;
          });
        } catch (error) {
          console.error('[ReportsFeed] Error syncing missed reports:', error);
        } finally {
          syncInProgressRef.current = false;
        }
      };

      setTimeout(syncMissedReports, 2000);

      // Periodic sync every 30 seconds
      syncTimer = setInterval(syncMissedReports, 30000);
    }

    // Cleanup
    return () => {
      firebaseUnsubscribe();
      if (pusherSubscriptionRef.current) {
        pusherSubscriptionRef.current();
      }
      if (syncTimer) {
        clearInterval(syncTimer);
      }
    };
  }, [user?.id, accessToken]);

  // Update report status (with API call for citizen reports)
  const updateReportStatus = useCallback(async (
    reportId: string,
    status: EmergencyReport['status']
  ) => {
    // Optimistic UI update
    const originalReport = reports.find(r => r.id === reportId);
    if (!originalReport) {
      console.warn('[ReportsFeed] Report not found for status update:', reportId);
      return;
    }

    const originalStatus = originalReport.status;
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId ? { ...report, status } : report
      )
    );

    // If it's a citizen report (PUROK- prefix), update via API
    if (reportId.startsWith('PUROK-')) {
      try {
        const authToken = accessToken || await AsyncStorage.getItem('@urbanwatch:auth_token');
        if (!authToken) {
          console.warn('[ReportsFeed] No auth token available for status update, rolling back UI.');
          // Rollback
          setReports(prevReports =>
            prevReports.map(report =>
              report.id === reportId ? { ...report, status: originalStatus } : report
            )
          );
          return;
        }

        const numericId = reportId.replace('PUROK-', '');
        const apiStatus: 'pending' | 'ongoing' | 'escalated' | 'resolved' =
          status === 'acknowledged' ? 'ongoing' :
          status === 'resolved' ? 'resolved' :
          'pending';

        console.log('[ReportsFeed] Updating concern status via API:', {
          reportId,
          numericId,
          frontendStatus: status,
          apiStatus,
        });

        await updateAssignedConcernStatus(authToken, numericId, apiStatus);

        console.log('[ReportsFeed] Status update successful');
        // Backend should broadcast this update to citizen's private channel
        // Expected event: concern.status.updated or concern.updated on citizen's channel
      } catch (error) {
        console.error('[ReportsFeed] Error updating concern status via API:', error);
        // Rollback on error
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === reportId ? { ...report, status: originalStatus } : report
          )
        );
      }
    }
  }, [reports, accessToken]);

  return {
    reports,
    loading,
    refreshing,
    fetchReports,
    handleRefresh,
    updateReportStatus,
  };
}

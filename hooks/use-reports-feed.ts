/**
 * Reports Feed Hook - Manages fetching, real-time updates, and status changes for emergency reports
 */

import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { anomalyToReport, fetchLatestAnomaliesSince, listenToAnomalies } from '@/services/firebase-service';
import { fetchAssignedConcerns, updateAssignedConcernStatus } from '@/services/purok-leader-service';
import { subscribeToCitizenReports, subscribeToStatusUpdates } from '@/services/realtime-service';
import type { EmergencyReport, FeedSource } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const { addNotificationFromReport, addNotification } = useNotifications();

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs to prevent unnecessary re-subscriptions
  const onNewReportRef = useRef(onNewReport);
  const addNotificationFromReportRef = useRef(addNotificationFromReport);
  const addNotificationRef = useRef(addNotification);
  const processedReportIds = useRef<Set<string>>(new Set());
  const notifiedReportIds = useRef<Set<string>>(new Set());
  const syncInProgressRef = useRef(false);
  const pusherSubscriptionRef = useRef<(() => void) | null>(null);
  const firebaseUnsubscribeRef = useRef<(() => void) | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onNewReportRef.current = onNewReport;
    addNotificationFromReportRef.current = addNotificationFromReport;
    addNotificationRef.current = addNotification;
  }, [onNewReport, addNotificationFromReport, addNotification]);

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
        setReports(prev => {
          // Sort by timestamp (newest first) after adding
          return [report, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
        addNotificationFromReportRef.current(report);
        onNewReportRef.current?.(report);
      });
    firebaseUnsubscribeRef.current = firebaseUnsubscribe;

    // Pusher subscription for citizen reports
    let syncTimer: ReturnType<typeof setInterval> | null = null;
    let statusUpdateUnsubscribe: (() => void) | null = null;
    
    if (accessToken) {
      let unsubscribePusher: (() => void) | null = null;
      
      // Subscribe to new concern assignments
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
              console.log('[ReportsFeed] Report already in list, skipping:', report.id);
              return prev;
            }
            console.log('[ReportsFeed] ✅ Adding new report to list:', report.id, report.title);
            // Sort by timestamp (newest first) after adding
            const updated = [report, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            console.log('[ReportsFeed] Total reports after adding:', updated.length);
            return updated;
          });

          // Trigger toast notification callback
          if (onNewReportRef.current) {
            console.log('[ReportsFeed] 🎯 Triggering onNewReport callback for:', report.id);
            onNewReportRef.current(report);
          } else {
            console.warn('[ReportsFeed] ⚠️ onNewReport callback is not set');
          }
        }
      ).then((unsubscribe) => {
        unsubscribePusher = unsubscribe;
        pusherSubscriptionRef.current = unsubscribe;
      }).catch((error) => {
        console.error('[ReportsFeed] Error subscribing to Pusher:', error);
      });

      // Subscribe to status updates (when concern status changes)
      subscribeToStatusUpdates(
        user.id,
        accessToken,
        (reportId, newStatus) => {
          console.log('[ReportsFeed] 🔄 Status update received from Pusher:', {
            reportId,
            newStatus,
          });

          // Update the report status in the list
          setReports(prevReports => {
            const reportExists = prevReports.some(r => r.id === reportId);
            if (!reportExists) {
              console.warn('[ReportsFeed] Report not found for status update:', reportId);
              return prevReports;
            }

            let reportTitle = '';
            const updated = prevReports.map(report => {
              if (report.id === reportId) {
                const oldStatus = report.status;
                reportTitle = report.title;
                console.log('[ReportsFeed] ✅ Updating report status:', {
                  reportId,
                  oldStatus,
                  newStatus,
                });
                
                // Add notification for status update
                setTimeout(() => {
                  addNotificationRef.current({
                    id: `status-update-${reportId}-${Date.now()}`,
                    type: 'report_update',
                    title: newStatus === 'resolved' ? 'Report Resolved' : 'Report Acknowledged',
                    message: reportTitle,
                    reportId: reportId,
                    timestamp: new Date(),
                    read: false,
                  });
                }, 0);
                
                return { ...report, status: newStatus };
              }
              return report;
            });

            // Sort by timestamp
            return updated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          });
        }
      ).then((unsubscribe) => {
        statusUpdateUnsubscribe = unsubscribe;
      }).catch((error) => {
        console.error('[ReportsFeed] Error subscribing to status updates:', error);
      });

      // Initial sync for missed reports and status updates (2 seconds after subscription)
      const syncMissedReports = async () => {
        if (syncInProgressRef.current) {
          return; // Skip silently if already in progress
        }
        try {
          syncInProgressRef.current = true;
          const concerns = await fetchAssignedConcerns(accessToken);
          
          setReports(prev => {
            const existingMap = new Map(prev.map(r => [r.id, r]));
            let hasUpdates = false;
            
            // Update existing reports and add new ones
            concerns.forEach(concern => {
              const reportId = concern.id;
              const existing = existingMap.get(reportId);
              
              if (existing) {
                // Update existing report if status changed
                if (existing.status !== concern.status) {
                  console.log(`[ReportsFeed] 🔄 Updating existing report status: ${reportId}`, {
                    oldStatus: existing.status,
                    newStatus: concern.status,
                  });
                  existingMap.set(reportId, { ...existing, ...concern });
                  hasUpdates = true;
                }
              } else {
                // Add new report
                console.log(`[ReportsFeed] ➕ Adding new report: ${reportId}`);
                existingMap.set(reportId, concern);
                hasUpdates = true;
              }
            });
            
            if (hasUpdates) {
              const updated = Array.from(existingMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
              console.log(`[ReportsFeed] ✅ Sync complete: ${updated.length} total reports`);
              return updated;
            }
            
            return prev;
          });
        } catch (error) {
          console.error('[ReportsFeed] Error syncing reports:', error);
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
      if (statusUpdateUnsubscribe) {
        statusUpdateUnsubscribe();
      }
      if (syncTimer) {
        clearInterval(syncTimer);
      }
    };
    // IMPORTANT: Do NOT include 'reports' in dependencies - it causes re-subscriptions
    // Only re-subscribe when user or token changes
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
        // Get token from context first, then fallback to AsyncStorage
        let authToken = accessToken;
        if (!authToken) {
          authToken = await AsyncStorage.getItem('@urbanwatch:auth_token');
        }
        
        if (!authToken) {
          console.error('[ReportsFeed] ❌ No auth token available for status update');
          console.error('[ReportsFeed] accessToken from context:', accessToken);
          console.error('[ReportsFeed] Token from storage:', await AsyncStorage.getItem('@urbanwatch:auth_token'));
          // Rollback
          setReports(prevReports =>
            prevReports.map(report =>
              report.id === reportId ? { ...report, status: originalStatus } : report
            )
          );
          return;
        }
        
        // Log token info for debugging (first 20 chars only)
        console.log('[ReportsFeed] Using auth token:', {
          tokenLength: authToken.length,
          tokenPrefix: authToken.substring(0, 20) + '...',
          tokenFormat: authToken.includes('|') ? 'valid (has pipe)' : 'invalid (no pipe)',
          source: accessToken ? 'context' : 'storage',
          matchesContext: accessToken === authToken,
        });

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

        const updateResponse = await updateAssignedConcernStatus(authToken, numericId, apiStatus);

        console.log('[ReportsFeed] Status update API call successful:', {
          reportId,
          apiStatus,
          response: updateResponse,
          hasData: !!updateResponse?.data,
          newStatus: updateResponse?.data?.new_status,
        });
        
        // Trust the API response - it confirms the status was updated
        // The response.new_status is the source of truth
        const responseStatus = updateResponse?.data?.new_status;
        
        // If response is empty or missing new_status, we still trust the optimistic update
        // and will refresh to get the actual status from the backend
        if (responseStatus) {
          // Map backend status from response to frontend status
          const responseStatusMap: Record<string, EmergencyReport['status']> = {
            'pending': 'pending',
            'ongoing': 'acknowledged',
            'escalated': 'acknowledged',
            'resolved': 'resolved',
          };
          
          const mappedStatus = responseStatusMap[responseStatus.toLowerCase()] || status;
          
          console.log('[ReportsFeed] ✅ API confirmed status update:', {
            reportId,
            apiResponse: responseStatus,
            mappedStatus,
            expectedStatus: status,
          });
          
          // Ensure the status is correctly set (even if already optimistic)
          setReports(prevReports =>
            prevReports.map(report =>
              report.id === reportId ? { ...report, status: mappedStatus } : report
            )
          );
        } else {
          console.warn('[ReportsFeed] ⚠️ API response missing new_status, will refresh to get actual status');
        }
        
        // Always refresh the report after update to get the latest status from backend
        // This is important because the backend might update distribution_status, not concern.status
        // Use retry logic to keep checking until status is updated
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000; // 1 second between retries
        
        const refreshReport = async () => {
          try {
            console.log(`[ReportsFeed] Refreshing report after status update (attempt ${retryCount + 1}/${maxRetries}):`, reportId);
            const refreshedConcerns = await fetchAssignedConcerns(authToken);
            const refreshedReport = refreshedConcerns.find(r => r.id === reportId);
            
            if (refreshedReport) {
              const statusMatches = refreshedReport.status === status;
              console.log('[ReportsFeed] Refreshed report status from backend:', {
                reportId,
                status: refreshedReport.status,
                expectedStatus: status,
                matches: statusMatches,
              });
              
              // Update with backend data
              setReports(prevReports =>
                prevReports.map(report =>
                  report.id === reportId ? refreshedReport : report
                )
              );
              
              // If status matches, we're done
              if (statusMatches) {
                console.log('[ReportsFeed] ✅ Status update confirmed by backend');
                return;
              }
              
              // If status doesn't match and we have retries left, try again
              if (retryCount < maxRetries - 1) {
                retryCount++;
                setTimeout(refreshReport, retryDelay);
              } else {
                console.warn('[ReportsFeed] ⚠️ Status not updated after max retries, keeping optimistic update');
              }
            } else {
              console.warn('[ReportsFeed] ⚠️ Report not found after refresh:', reportId);
              // Retry if report not found (might be a timing issue)
              if (retryCount < maxRetries - 1) {
                retryCount++;
                setTimeout(refreshReport, retryDelay);
              }
            }
          } catch (error) {
            console.error('[ReportsFeed] Error refreshing report after update:', error);
            // Retry on error
            if (retryCount < maxRetries - 1) {
              retryCount++;
              setTimeout(refreshReport, retryDelay);
            }
          }
        };
        
        // Start refresh after initial delay
        setTimeout(refreshReport, 1000);
        
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

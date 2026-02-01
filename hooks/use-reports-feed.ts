/**
 * Reports Feed Hook - Manages fetching, real-time updates, and status changes for emergency reports
 */

import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { fetchAssignedConcerns, updateAssignedConcernStatus } from '@/services/purok-leader-service';
import { subscribeToCitizenReports, subscribeToStatusUpdates } from '@/services/realtime-service';
import type { EmergencyReport, FeedSource } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// Helper to safely trigger push notification (works in dev builds, gracefully fails in Expo Go)
const tryScheduleNotification = async (title: string, body: string, data?: Record<string, any>) => {
  try {
    const { scheduleNotification } = await import('@/services/notifications');
    await scheduleNotification(title, body, data);
  } catch (error) {
    // Silently fail in Expo Go - toast/haptic still work
    console.log('[ReportsFeed] Push notification skipped (Expo Go)');
  }
};

interface UseReportsFeedOptions {
  onNewReport?: (report: EmergencyReport) => void;
}

interface UseReportsFeedReturn {
  reports: EmergencyReport[];
  loading: boolean;
  refreshing: boolean;
  fetchReports: (source: FeedSource) => Promise<void>;
  handleRefresh: (source: FeedSource) => Promise<void>;
  updateReportStatus: (reportId: string, status: EmergencyReport['status'], remarks?: string, rejectionReason?: string) => Promise<void>;
}

export function useReportsFeed(options: UseReportsFeedOptions = {}): UseReportsFeedReturn {
  const { onNewReport } = options;
  const { user, accessToken } = useAuth();
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

  // Update refs when callbacks change
  useEffect(() => {
    onNewReportRef.current = onNewReport;
    addNotificationFromReportRef.current = addNotificationFromReport;
    addNotificationRef.current = addNotification;
  }, [onNewReport, addNotificationFromReport, addNotification]);

  // Fetch reports from API
  const fetchReports = useCallback(async (source: FeedSource) => {
    try {
      setLoading(true);
      const allReports: EmergencyReport[] = [];

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
  }, [accessToken, user?.id]);

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

          // Add notification for new concern (only once per report)
          if (!notifiedReportIds.current.has(report.id)) {
            notifiedReportIds.current.add(report.id);
            // Use addNotification directly with proper title for new concerns
            const notification = {
              id: `new-report-${report.id}-${Date.now()}`,
              type: 'new_report' as const,
              title: 'New Concern Reported',
              message: report.title || report.description || 'New concern reported',
              reportId: report.id,
              timestamp: new Date(),
              read: false,
              severity: report.severity,
              reportType: report.type,
            };
            console.log('[ReportsFeed] 🔔 Adding notification:', notification);
            if (addNotificationRef.current) {
              addNotificationRef.current(notification);
              console.log('[ReportsFeed] ✅ Notification added for new report:', report.id);
            } else {
              console.error('[ReportsFeed] ❌ addNotificationRef is not set!');
            }
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

          // 🔔 Trigger push notification with sound (if available - dev builds only)
          const severityEmoji = report.severity === 'critical' ? '🚨' : report.severity === 'high' ? '⚠️' : '📢';
          const categoryLabel = (report as any).originalCategory?.toUpperCase() || 'CONCERN';
          tryScheduleNotification(
            `${severityEmoji} New ${categoryLabel} Report`,
            report.title || report.description,
            {
              type: 'citizen_report',
              reportId: report.id,
              severity: report.severity,
              category: (report as any).originalCategory,
            }
          );
          console.log('[ReportsFeed] 🔔 Notification triggered for:', report.id);
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
                
                // Note: We don't add notifications for status updates
                // Only NEW concerns should appear in the notifications list
                
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
    status: EmergencyReport['status'],
    remarks?: string,
    rejectionReason?: string
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
          source: accessToken ? 'context' : 'storage',
        });

        const numericId = reportId.replace('PUROK-', '');
        const apiStatus: 'pending' | 'ongoing' | 'escalated' | 'resolved' | 'rejected' =
          status === 'acknowledged' ? 'ongoing' :
          status === 'resolved' ? 'resolved' :
          status === 'rejected' ? 'rejected' :
          'pending';

        console.log('[ReportsFeed] Updating concern status via API:', {
          reportId,
          numericId,
          frontendStatus: status,
          apiStatus,
          hasRemarks: !!remarks,
          hasRejectionReason: !!rejectionReason,
        });

        const updateResponse = await updateAssignedConcernStatus(authToken, numericId, apiStatus, remarks, rejectionReason);

        console.log('[ReportsFeed] Status update API call successful:', {
          reportId,
          apiStatus,
          response: updateResponse,
        });
        
        // Trust the API response - it confirms the status was updated
        const responseStatus = updateResponse?.data?.new_status;
        
        if (responseStatus) {
          // Map backend status from response to frontend status
          const responseStatusMap: Record<string, EmergencyReport['status']> = {
            'pending': 'pending',
            'ongoing': 'acknowledged',
            'escalated': 'acknowledged',
            'resolved': 'resolved',
            'rejected': 'rejected',
          };
          
          const mappedStatus = responseStatusMap[responseStatus.toLowerCase()] || status;
          
          console.log('[ReportsFeed] ✅ API confirmed status update:', {
            reportId,
            apiResponse: responseStatus,
            mappedStatus,
          });
          
          // Ensure the status is correctly set
          setReports(prevReports =>
            prevReports.map(report =>
              report.id === reportId ? { ...report, status: mappedStatus } : report
            )
          );
        }
        
        // Refresh report after update to get the latest status from backend
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000;
        
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
              
              if (statusMatches) {
                console.log('[ReportsFeed] ✅ Status update confirmed by backend');
                return;
              }
              
              if (retryCount < maxRetries - 1) {
                retryCount++;
                setTimeout(refreshReport, retryDelay);
              }
            } else {
              if (retryCount < maxRetries - 1) {
                retryCount++;
                setTimeout(refreshReport, retryDelay);
              }
            }
          } catch (error) {
            console.error('[ReportsFeed] Error refreshing report after update:', error);
            if (retryCount < maxRetries - 1) {
              retryCount++;
              setTimeout(refreshReport, retryDelay);
            }
          }
        };
        
        setTimeout(refreshReport, 1000);
        
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

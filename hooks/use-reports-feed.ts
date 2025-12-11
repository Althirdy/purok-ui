import { MAX_REPORTS_LIMIT } from '@/constants/sensor-config';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { anomalyToReport, deviceStatusToReport, fetchLatestAnomaliesSince, fetchLatestDeviceStatusSince, listenToAnomalies } from '@/services/firebase-service';
import { fetchAssignedConcerns, updateAssignedConcernStatus } from '@/services/purok-leader-service';
import { subscribeToPurokAssignments } from '@/services/realtime-service';
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
  const { sessionStartMs, user, accessToken } = useAuth();
  const { addNotificationFromReport } = useNotifications();
  const { onNewReport, onToastRequest } = options;

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);

  // Performance optimization: Track processed IDs and batch updates
  const processedReportIds = useRef<Set<string>>(new Set());
  const notifiedReportIds = useRef<Set<string>>(new Set()); // Track which reports have triggered notifications
  const pendingReports = useRef<EmergencyReport[]>([]);
  const updateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const immediateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdating = useRef(false);
  const MAX_REPORTS = MAX_REPORTS_LIMIT;

  // Fetch sensor reports by source (Firebase real-time only)
  const fetchSensorReports = useCallback(async (source: FeedSource): Promise<EmergencyReport[]> => {
    let sensorReports: EmergencyReport[] = [];

    // Only fetch sensor reports from Firebase (sensor_box or all)
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

    // Note: Citizen reports come from Pusher real-time (not API fetch)
    // They are added via the Pusher subscription in useEffect
    // Filtering by source will work based on the report.source field

    // Filter by source if not 'all'
    const filteredReports = source === 'all'
      ? sensorReports
      : sensorReports.filter(r => {
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
      // Preserve audio and reportType from fresh reports (they have the latest data)
      const merged = freshReports.map(fresh => {
        const existing = existingMap.get(fresh.id);
        if (existing) {
          // Preserve status from existing, but use fresh audio/reportType if available
          return { 
            ...fresh, 
            status: existing.status,
            // Preserve audio and reportType from fresh (newer data)
            audio: fresh.audio ?? existing.audio,
            reportType: fresh.reportType ?? existing.reportType,
          };
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
  // Use ref to prevent duplicate subscriptions
  const pusherSubscriptionRef = useRef<(() => void) | null>(null);
  const syncInProgressRef = useRef(false);
  const onNewReportRef = useRef(onNewReport);
  const addNotificationFromReportRef = useRef(addNotificationFromReport);
  
  // Update refs when callbacks change
  useEffect(() => {
    onNewReportRef.current = onNewReport;
    addNotificationFromReportRef.current = addNotificationFromReport;
  }, [onNewReport, addNotificationFromReport]);
  
  useEffect(() => {
    // Clean up existing subscription first
    if (pusherSubscriptionRef.current) {
      console.log('[ReportsFeed] Cleaning up existing Pusher subscription');
      pusherSubscriptionRef.current();
      pusherSubscriptionRef.current = null;
    }
    
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

      // Citizen channel subscription (Pusher private channel per purok leader)
      if (accessToken && user?.id) {
        unsubscribeCitizen = subscribeToPurokAssignments({
          token: accessToken,
          userId: user.id,
          onReport: report => {
            console.log('[ReportsFeed] Received Pusher report:', {
              id: report.id,
              title: report.title,
              concernId: report.id.replace('PUROK-', ''),
            });
            
            if (processedReportIds.current.has(report.id)) {
              console.log('[ReportsFeed] Report already processed, skipping:', report.id);
              return;
            }
            
            processedReportIds.current.add(report.id);
            
            setReports(prev => {
              if (prev.some(r => r.id === report.id)) {
                console.log('[ReportsFeed] Report already in list, skipping:', report.id);
                return prev;
              }
              console.log('[ReportsFeed] Adding new report to feed:', report.id);
              return [report, ...prev].slice(0, MAX_REPORTS);
            });
            setNewReportCount(p => p + 1);
            
            // Add notification for new concern (updates notification bell badge) - only once per report
            if (!notifiedReportIds.current.has(report.id)) {
              notifiedReportIds.current.add(report.id);
              if (addNotificationFromReportRef.current) {
                try {
                  addNotificationFromReportRef.current(report);
                  console.log('[ReportsFeed] ✅ Added notification for report:', report.id);
                } catch (error) {
                  console.error('[ReportsFeed] Error adding notification:', error);
                }
              } else {
                console.warn('[ReportsFeed] ⚠️ addNotificationFromReport callback is not defined');
              }
            } else {
              console.log('[ReportsFeed] Notification already added for report:', report.id);
            }
            
            // Trigger toast notification callback for ALL reports from Pusher
            console.log('[ReportsFeed] Calling onNewReport callback for toast notification');
            if (onNewReportRef.current) {
              try {
                onNewReportRef.current(report);
                console.log('[ReportsFeed] ✅ Successfully called onNewReport callback');
              } catch (error) {
                console.error('[ReportsFeed] Error calling onNewReport callback:', error);
              }
            } else {
              console.warn('[ReportsFeed] ⚠️ onNewReport callback is not defined');
            }
          },
        });
        pusherSubscriptionRef.current = unsubscribeCitizen;
        
        // Fetch any missed reports from API when subscription is established
        // This ensures we get reports that were published while app was offline or subscription wasn't active
        const syncMissedReports = async () => {
          // Prevent multiple simultaneous syncs
          if (syncInProgressRef.current) {
            console.log('[ReportsFeed] Sync already in progress, skipping...');
            return;
          }
          
          try {
            syncInProgressRef.current = true;
            console.log('[ReportsFeed] Syncing missed reports from API...');
            const authToken = await AsyncStorage.getItem('@urbanwatch:auth_token');
            if (authToken) {
              const apiReports = await fetchAssignedConcerns(authToken);
              
              console.log('[ReportsFeed] Fetched', apiReports.length, 'reports from API');
              
              // Add any reports from API that we don't have yet
              setReports(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const newReports = apiReports.filter(r => !existingIds.has(r.id));
                
                if (newReports.length > 0) {
                  console.log('[ReportsFeed] Found', newReports.length, 'missed reports:', newReports.map(r => r.id));
                  newReports.forEach(r => processedReportIds.current.add(r.id));
                  return [...newReports, ...prev].slice(0, MAX_REPORTS);
                } else {
                  console.log('[ReportsFeed] No missed reports found - all reports are already in feed');
                }
                
                return prev;
              });
            }
          } catch (error) {
            console.error('[ReportsFeed] Error syncing missed reports:', error);
          } finally {
            syncInProgressRef.current = false;
          }
        };
        
        // Sync after a short delay to allow subscription to establish (only once)
        const syncTimer = setTimeout(syncMissedReports, 2000);
        
        // Store timer for cleanup
        (unsubscribeCitizen as any).syncTimer = syncTimer;
      }

      // Set up interval to process pending reports
      updateTimer.current = setInterval(() => {
        processPendingReports();
      }, DATA_PROCESSING_INTERVAL);
      
      // Periodic sync to catch any missed reports (every 30 seconds)
      syncTimer.current = setInterval(async () => {
        // Skip if sync is already in progress
        if (syncInProgressRef.current) {
          return;
        }
        
        try {
          syncInProgressRef.current = true;
          const authToken = await AsyncStorage.getItem('@urbanwatch:auth_token');
          if (authToken) {
            const apiReports = await fetchAssignedConcerns(authToken);
            setReports(prev => {
              const existingIds = new Set(prev.map(r => r.id));
              const newReports = apiReports.filter(r => !existingIds.has(r.id));
              
              if (newReports.length > 0) {
                console.log('[ReportsFeed] Periodic sync found', newReports.length, 'new reports:', newReports.map(r => r.id));
                newReports.forEach(r => processedReportIds.current.add(r.id));
                return [...newReports, ...prev].slice(0, MAX_REPORTS);
              }
              
              return prev;
            });
          }
        } catch (error) {
          console.error('[ReportsFeed] Error in periodic sync:', error);
        } finally {
          syncInProgressRef.current = false;
        }
      }, 30000); // Every 30 seconds
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
    }

    // Cleanup on unmount
    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
      if (syncTimer.current) {
        clearInterval(syncTimer.current);
      }
      if (immediateTimer.current) {
        clearTimeout(immediateTimer.current);
        immediateTimer.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
      if (unsubscribeCitizen) {
        // Clear sync timer if it exists
        if ((unsubscribeCitizen as any).syncTimer) {
          clearTimeout((unsubscribeCitizen as any).syncTimer);
        }
        unsubscribeCitizen();
        pusherSubscriptionRef.current = null; // Clear ref on cleanup
      }
      processedReportIds.current.clear();
      notifiedReportIds.current.clear();
      pendingReports.current = [];
    };
  }, [processPendingReports, user?.id, accessToken]);

  // Load cached reports on mount
  useEffect(() => {
    const loadCachedReports = async () => {
      try {
        const cached = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Convert timestamp strings back to Date objects and re-normalize missing fields
          const withDates = parsed.map((r: any) => {
            const report = {
              ...r,
              timestamp: new Date(r.timestamp),
            };
            // Re-normalize audio and reportType if missing (for citizen reports)
            if (report.source === 'citizen' && !report.reportType) {
              const hasAudio = report.audio && report.audio.trim().length > 0;
              const isVoiceCategory = report.title?.toLowerCase().includes('voice concern') || 
                                      report.description?.toLowerCase().includes('audio recording');
              report.reportType = (hasAudio || isVoiceCategory) ? 'voice' : 'manual';
            }
            return report;
          });
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

  // Update report status (with API call for citizen reports)
  // Note: Backend should broadcast status updates to citizen's private channel
  // so the citizen app receives real-time updates when purok leader acknowledges/resolves
  const updateReportStatus = useCallback(async (reportId: string, status: EmergencyReport['status']) => {
    // Optimistic UI update
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId ? { ...report, status } : report
      )
    );

    // If it's a citizen report (PUROK- prefix), update via API
    if (reportId.startsWith('PUROK-')) {
      try {
        const authToken = await AsyncStorage.getItem('@urbanwatch:auth_token');
        if (authToken) {
          // Extract numeric ID from PUROK-{id} format
          const numericId = reportId.replace('PUROK-', '');
          // Map frontend status to backend status
          const apiStatus: 'pending' | 'ongoing' | 'escalated' | 'resolved' = 
            status === 'acknowledged' ? 'ongoing' : 
            status === 'resolved' ? 'resolved' : 
            'pending';
          
          console.log('[ReportsFeed] Updating concern status:', {
            reportId,
            numericId,
            frontendStatus: status,
            apiStatus,
          });
          
          const response = await updateAssignedConcernStatus(authToken, numericId, apiStatus);
          
          console.log('[ReportsFeed] Status update successful:', response);
          // Backend should broadcast this update to citizen's private channel
          // Expected event: concern.updated or concern.status.updated on citizen's channel
        } else {
          console.warn('[ReportsFeed] No auth token available for status update');
        }
      } catch (error) {
        console.error('[ReportsFeed] Error updating concern status:', error);
        // Rollback on error
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === reportId ? { ...report, status: 'pending' } : report
          )
        );
      }
    }
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


/**
 * Report Details Screen - Concise view matching modal UI/UX
 */

import { ReportDetailsBody } from '@/components/report/report-details-body';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { getSeverityColor } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reportDetailsStyles as styles } from './report-details.styles';

const { colors, spacing, typography } = DesignSystem;

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams();
  const reportId = String(params.reportId || '');

  // Get reports from feed hook
  const { reports, updateReportStatus, fetchReports } = useReportsFeed();
  const [report, setReport] = useState<EmergencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  

  // Fetch reports on mount to ensure we have the latest data
  useEffect(() => {
    fetchReports('all');
  }, [fetchReports]);

  useEffect(() => {
    // Find report from feed
    const foundReport = reports.find(r => r.id === reportId);
    if (foundReport) {
      console.log('[ReportDetails] Found/updated report:', {
        id: foundReport.id,
        title: foundReport.title,
        status: foundReport.status,
        audio: foundReport.audio,
        reportType: foundReport.reportType,
        hasAudio: !!foundReport.audio,
      });
      // Always sync with the latest data from feed (keeps UI in sync with newsfeed)
      setReport(foundReport);
      setLoading(false);
      return;
    }

    // If we have some reports but didn't find this one, retry once after a short delay.
    if (reports.length > 0) {
      const timer = setTimeout(() => {
        const retryReport = reports.find(r => r.id === reportId);
        if (retryReport) {
          console.log('[ReportDetails] Found report (retry):', {
            id: retryReport.id,
            title: retryReport.title,
            status: retryReport.status,
            audio: retryReport.audio,
            reportType: retryReport.reportType,
            hasAudio: !!retryReport.audio,
          });
          setReport(retryReport);
        } else {
          // After retry, give up and show "Report not found"
          setReport(null);
        }
        setLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Fallback: if reports array stays empty for a while, avoid infinite loading spinner
    const emptyTimer = setTimeout(() => {
      if (!report) {
        setLoading(false);
      }
    }, 4000);

    return () => clearTimeout(emptyTimer);
  }, [reports, reportId]); // Removed 'report' from deps to avoid loop but still sync from feed

  // Parse coordinates from location string if available
  const parseCoordinates = (location: string) => {
    const latMatch = location.match(/Lat\s+([\d.]+)/i);
    const lngMatch = location.match(/Lng\s+([\d.]+)/i);
    if (latMatch && lngMatch) {
      return {
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(lngMatch[1]),
      };
    }
    return null;
  };

  const coords = report?.coordinates || (report ? parseCoordinates(report.location) : null);
  const mapRegion = coords ? {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : null;

  const severityColor = report ? getSeverityColor(report.severity) : colors.accent.orange;

  // Simple status timeline steps (Pending -> Acknowledged -> Resolved)
  const statusSteps: Array<{
    key: EmergencyReport['status'];
    label: string;
    description: string;
  }> = [
    {
      key: 'pending',
      label: 'Pending',
      description: 'Concern submitted and automatically distributed to Purok Leader.',
    },
    {
      key: 'acknowledged',
      label: 'Ongoing',
      description: 'The concern is being handled by the Purok Leader.',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      description: 'The concern has been resolved.',
    },
  ];

  // Handle acknowledge with remarks (called from body)
  const handleAcknowledge = useCallback(async (remarks?: string) => {
    if (report && report.status === 'pending') {
      try {
        await updateReportStatus(report.id, 'acknowledged', remarks);
        setReport(prev => (prev ? { ...prev, status: 'acknowledged' } : prev));
      } catch (error) {
        console.error('Failed to acknowledge report:', error);
      }
    }
  }, [report, updateReportStatus]);

  // Handle resolve with remarks (called from body)
  const handleResolve = useCallback(async (remarks?: string) => {
    if (report && report.status === 'acknowledged') {
      try {
        await updateReportStatus(report.id, 'resolved', remarks);
        setReport(prev => (prev ? { ...prev, status: 'resolved' } : prev));
      } catch (error) {
        console.error('Failed to resolve report:', error);
      }
    }
  }, [report, updateReportStatus]);

  // Handle reject with reason (called from body)
  const handleReject = useCallback(async (rejectionReason: string) => {
    if (report && (report.status === 'pending' || report.status === 'acknowledged')) {
      try {
        await updateReportStatus(report.id, 'rejected', undefined, rejectionReason);
        setReport(prev => (prev ? { ...prev, status: 'rejected' } : prev));
      } catch (error) {
        console.error('Failed to reject report:', error);
      }
    }
  }, [report, updateReportStatus]);

  const handleMapPress = () => {
    if (report && coords) {
      router.push({
        pathname: '/(tabs)/map',
        params: {
          reportId: report.id,
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
        },
      } as any);
    }
  };

  // Audio playback handlers
  const playAudio = async () => {
    if (!report?.audio) return;

    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Load and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: report.audio },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      // Handle playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            newSound.unloadAsync();
            setSound(null);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      // Fallback: open audio URL in browser
      if (report.audio) {
        Linking.openURL(report.audio).catch(err => {
          console.error('Error opening audio URL:', err);
        });
      }
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.headerBar}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Citizen Concern</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={{ color: colors.text.secondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.headerBar}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Citizen Concern</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md }}>
            Report not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: colors.primary.blue,
              paddingVertical: spacing.md,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Concern</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ReportDetailsBody
        report={report}
        severityColor={severityColor}
        statusSteps={statusSteps}
        isPlaying={isPlaying}
        coords={coords}
        mapRegion={mapRegion}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        onReject={handleReject}
        onMapPress={handleMapPress}
        onPlayAudio={playAudio}
        onStopAudio={stopAudio}
      />
    </SafeAreaView>
  );
}

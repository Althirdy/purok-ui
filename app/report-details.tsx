/**
 * Report Details Screen - Concise view matching modal UI/UX
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import {
  cleanTitle,
  formatDateReadable,
  formatReportId,
  formatTime12Hour,
  getSeverityColor,
} from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

const { colors, spacing, typography } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.blue,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  idBadgeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  idLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  idBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  idText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'monospace',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  imageGallery: {
    marginTop: spacing.sm,
  },
  imageGalleryContent: {
    paddingRight: spacing.lg,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  locationCard: {
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  mapCoordinates: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  severityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  severityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  actionButton: {
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 48,
  },
  actionButtonResolve: {
    backgroundColor: colors.semantic.success,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  resolvedText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  audioSection: {
    marginTop: spacing.sm,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  audioUrl: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
});

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams();
  const reportId = String(params.reportId || '');

  // Get reports from feed hook
  const { reports, updateReportStatus, fetchReports } = useReportsFeed();
  const [report, setReport] = React.useState<EmergencyReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Fetch reports on mount to ensure we have the latest data
  useEffect(() => {
    fetchReports('all');
  }, [fetchReports]);

  useEffect(() => {
    // Find report from feed
    const foundReport = reports.find(r => r.id === reportId);
    if (foundReport) {
      console.log('[ReportDetails] Found report:', {
        id: foundReport.id,
        title: foundReport.title,
        audio: foundReport.audio,
        reportType: foundReport.reportType,
        hasAudio: !!foundReport.audio,
      });
      setReport(foundReport);
      setLoading(false);
    } else if (reports.length > 0) {
      // Retry after a short delay in case report is still loading
      const timer = setTimeout(() => {
        const retryReport = reports.find(r => r.id === reportId);
        if (retryReport) {
          console.log('[ReportDetails] Found report (retry):', {
            id: retryReport.id,
            title: retryReport.title,
            audio: retryReport.audio,
            reportType: retryReport.reportType,
            hasAudio: !!retryReport.audio,
          });
          setReport(retryReport);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reports, reportId]);

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

  const handleAcknowledge = async () => {
    if (report) {
      try {
        await updateReportStatus(report.id, 'acknowledged');
        setReport(prev => (prev ? { ...prev, status: 'acknowledged' } : prev));
      } catch (error) {
        console.error('Failed to acknowledge report:', error);
      }
    }
  };

  const handleResolve = async () => {
    if (report) {
      try {
        await updateReportStatus(report.id, 'resolved');
        setReport(prev => (prev ? { ...prev, status: 'resolved' } : prev));
      } catch (error) {
        console.error('Failed to resolve report:', error);
      }
    }
  };

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
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Citizen Report</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={{ color: colors.text.secondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Citizen Report</Text>
          <View style={styles.headerSpacer} />
        </View>
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
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Citizen Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report ID Badge */}
        <View style={styles.idBadgeContainer}>
          <Text style={styles.idLabel}>Report ID</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>{formatReportId(report.id)}</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What happened?</Text>
          <Text style={styles.titleText}>{cleanTitle(report.title)}</Text>
          <Text style={styles.dateText}>
            {formatDateReadable(report.timestamp)} {formatTime12Hour(report.timestamp)}
          </Text>
        </View>

        {/* Description */}
        {report.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Details</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
            
            {/* Audio Player for Voice Concerns */}
            {/* Show audio player if audio exists OR if it's a voice concern (by title/description) */}
            {(report.audio || 
              report.reportType === 'voice' || 
              report.title?.toLowerCase().includes('voice concern') ||
              report.description?.toLowerCase().includes('audio recording')) && (
              <View style={styles.audioSection}>
                <View style={styles.audioPlayer}>
                  {report.audio ? (
                    <>
                      <TouchableOpacity
                        style={styles.audioButton}
                        onPress={isPlaying ? stopAudio : playAudio}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={24}
                          color={colors.text.inverse}
                        />
                      </TouchableOpacity>
                      <View style={styles.audioInfo}>
                        <Text style={styles.audioLabel}>Voice Recording</Text>
                        <Text style={styles.audioUrl} numberOfLines={1}>
                          {report.audio}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.audioButton, { backgroundColor: colors.neutral.gray600 }]}>
                        <Ionicons
                          name="mic"
                          size={24}
                          color={colors.text.inverse}
                        />
                      </View>
                      <View style={styles.audioInfo}>
                        <Text style={styles.audioLabel}>Voice Recording</Text>
                        <Text style={styles.audioUrl}>
                          Audio file not available yet
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Images Gallery */}
        {report.images && report.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos from citizen</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imageGallery}
              contentContainerStyle={styles.imageGalleryContent}
            >
              {report.images.map((imageUrl, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location with Map */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={colors.primary.blue} />
              <Text style={styles.locationText}>{report.location}</Text>
            </View>
            {mapRegion && coords && (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={handleMapPress}
                style={styles.mapContainer}
              >
                <MapView
                  style={styles.map}
                  initialRegion={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  mapType="standard"
                >
                  <Marker
                    coordinate={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    }}
                    title={report.title}
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons name="location" size={24} color={colors.semantic.error} />
                    </View>
                  </Marker>
                </MapView>
                <View style={styles.mapOverlay}>
                  <Text style={styles.mapCoordinates}>
                    {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.section}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                <Text style={[styles.severityBadgeText, { color: severityColor }]}>
                  {report.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.infoLabel}>Priority</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {report.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleAcknowledge}
            >
              <Text style={styles.actionButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {report.status === 'acknowledged' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonResolve]}
              activeOpacity={0.8}
              onPress={handleResolve}
            >
              <Text style={styles.actionButtonText}>Mark as Resolved</Text>
            </TouchableOpacity>
          )}
          {report.status === 'resolved' && (
            <Text style={styles.resolvedText}>Report resolved</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

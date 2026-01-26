import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ImageViewer } from '@/components/ui/image-viewer';
import { RejectSheet } from '@/components/news/reject-sheet';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { EmergencyReport, RelatedReport } from '@/types';
import { DesignSystem } from '@/constants/design-system';
import {
  cleanTitle,
  formatDateReadable,
  formatReportId,
  formatTime12Hour,
} from '@/utils/reportHelpers';
import { reportDetailsStyles as styles } from '@/app/report-details.styles';

const { colors, spacing, typography } = DesignSystem;

type StatusStep = {
  key: EmergencyReport['status'];
  label: string;
  description: string;
};

interface ReportDetailsBodyProps {
  report: EmergencyReport;
  severityColor: string;
  statusSteps: StatusStep[];
  isPlaying: boolean;
  coords: { latitude: number; longitude: number } | null;
  mapRegion:
    | {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
      }
    | null;
  onAcknowledge: (remarks?: string) => void;
  onResolve: (remarks?: string) => void;
  onReject: (reason: string) => void;
  onMapPress: () => void;
  onPlayAudio: () => Promise<void>;
  onStopAudio: () => Promise<void>;
}

const FOLLOW_UP_LIMIT = 3;

export function ReportDetailsBody({
  report,
  severityColor,
  statusSteps,
  isPlaying,
  coords,
  mapRegion,
  onAcknowledge,
  onResolve,
  onReject,
  onMapPress,
  onPlayAudio,
  onStopAudio,
}: ReportDetailsBodyProps) {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [rejectSheetVisible, setRejectSheetVisible] = useState(false);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  // Format relative time for follow-up reports
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Filter only actual image files (exclude audio files like .m4a, .mp3, .wav)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
  const validImages = report.images?.filter((url) => {
    if (!url || typeof url !== 'string') return false;
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  }) || [];

  // Check if transcript is a valid transcript (not an error message)
  const isTranscriptError = report.transcript?.toLowerCase().includes('unavailable') || 
                            report.transcript?.toLowerCase().includes('error') ||
                            report.transcript?.toLowerCase().includes('failed');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Report ID Badge */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.idBadgeContainer}>
        <Text style={styles.idLabel}>Report ID</Text>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{formatReportId(report.id)}</Text>
        </View>
      </Animated.View>

      {/* Title Section */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>What happened?</Text>
        <Text style={styles.titleText}>{cleanTitle(report.title)}</Text>
        <Text style={styles.dateText}>
          {formatDateReadable(report.timestamp)} {formatTime12Hour(report.timestamp)}
        </Text>
      </Animated.View>

      {/* Description */}
      {report.description && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <Text style={styles.descriptionText}>{report.description}</Text>
        </Animated.View>
      )}

      {/* Voice Recording + Transcript for Voice Concerns */}
      {(report.audio ||
        report.reportType === 'voice' ||
        report.title?.toLowerCase().includes('voice concern') ||
        report.description?.toLowerCase().includes('audio recording')) && (
        <>
          {/* Voice Recording */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>Voice Recording</Text>
            <View style={styles.audioSection}>
              <View style={styles.audioPlayer}>
                {report.audio ? (
                  <>
                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={isPlaying ? onStopAudio : onPlayAudio}
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
                    <View
                      style={[styles.audioButton, { backgroundColor: colors.neutral.gray600 }]}
                    >
                      <Ionicons name="mic" size={24} color={colors.text.inverse} />
                    </View>
                    <View style={styles.audioInfo}>
                      <Text style={styles.audioLabel}>Voice Recording</Text>
                      <Text style={styles.audioUrl}>Audio file not available yet</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Voice Transcript */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <View style={styles.transcriptHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary.blue} />
              <Text style={styles.sectionLabel}>Voice Transcript</Text>
            </View>
            {report.transcript && !isTranscriptError ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptText}>{report.transcript}</Text>
              </View>
            ) : report.transcriptionStatus === 'failed' || isTranscriptError ? (
              <View style={styles.transcriptErrorBox}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.semantic.error} />
                <Text style={styles.transcriptErrorText}>
                  We were unable to transcribe this audio recording.
                </Text>
              </View>
            ) : (
              <View style={styles.transcriptProcessingBox}>
                <View style={styles.transcriptProcessingIcon}>
                  <ActivityIndicator size="small" color={colors.primary.blue} />
                </View>
                <View style={styles.transcriptProcessingContent}>
                  <Text style={styles.transcriptProcessingTitle}>Processing Transcript</Text>
                  <Text style={styles.transcriptProcessingText}>
                    Your voice recording is being transcribed. This usually takes a few moments...
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* Images Gallery */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>Photos from citizen</Text>
        {validImages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            contentContainerStyle={styles.imageGalleryContent}
          >
            {validImages.map((imageUrl, index) => (
              <Pressable 
                key={index} 
                style={styles.imageContainer}
                onPress={() => handleImagePress(index)}
              >
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.imageTapHint}>
                  <Ionicons name="expand-outline" size={16} color={colors.text.inverse} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={40} color={colors.neutral.gray400} />
            <Text style={styles.noImageText}>No photos attached</Text>
            <Text style={styles.noImageSubtext}>The citizen did not include any photos</Text>
          </View>
        )}
      </Animated.View>

      {/* Image Viewer Modal */}
      {validImages.length > 0 && (
        <ImageViewer
          images={validImages}
          initialIndex={selectedImageIndex}
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      {/* Info Grid */}
      <Animated.View entering={FadeInDown.delay(420).duration(500)} style={styles.section}>
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
      </Animated.View>

      {/* Status Timeline */}
      <Animated.View entering={FadeInDown.delay(460).duration(500)} style={styles.timelineSection}>
        <View style={styles.timelineHeader}>
          <Ionicons name="time-outline" size={18} color={colors.primary.blue} />
          <Text style={styles.timelineTitle}>Status Timeline</Text>
        </View>
        <View style={styles.timelineList}>
          {statusSteps.map((step, index) => {
            const isActive =
              report.status === step.key ||
              (step.key === 'acknowledged' && report.status === 'resolved') ||
              (step.key === 'pending' && report.status === 'pending');
            const isCompleted =
              step.key === 'pending' ||
              (step.key === 'acknowledged' &&
                (report.status === 'acknowledged' || report.status === 'resolved')) ||
              (step.key === 'resolved' && report.status === 'resolved');

            const dotColor =
              isActive || isCompleted ? colors.primary.blue : colors.border.light;
            const textOpacity = isCompleted || isActive ? 1 : 0.5;

            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineMarker}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: dotColor,
                      },
                    ]}
                  />
                  {index < statusSteps.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, { opacity: textOpacity }]}>
                    {step.label}
                  </Text>
                  <Text style={[styles.timelineDescription, { opacity: textOpacity }]}>
                    {step.description}
                  </Text>
                  {index === 0 && (
                    <Text style={styles.timelineMeta}>
                      Reported {formatDateReadable(report.timestamp)}{' '}
                      {formatTime12Hour(report.timestamp)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Follow-up Activity (Related Reports / Merged Duplicates) */}
      {report.relatedReports && report.relatedReports.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <View style={followUpStyles.sectionHeader}>
            <Ionicons name="git-merge-outline" size={18} color={colors.primary.blue} />
            <Text style={styles.sectionLabel}>Follow-up Activity ({report.relatedReports.length})</Text>
          </View>
          <View style={followUpStyles.updatesContainer}>
            {(showAllUpdates 
              ? report.relatedReports 
              : report.relatedReports.slice(0, FOLLOW_UP_LIMIT)
            ).map((update, index) => (
              <View 
                key={update.id} 
                style={[
                  followUpStyles.updateCard,
                  (showAllUpdates 
                    ? index < report.relatedReports!.length - 1 
                    : index < FOLLOW_UP_LIMIT - 1 && index < report.relatedReports!.length - 1
                  ) && followUpStyles.updateCardWithBorder
                ]}
              >
                <View style={followUpStyles.updateHeader}>
                  <View style={followUpStyles.updateBadge}>
                    <Ionicons name="add-circle" size={16} color="#10b981" />
                    <Text style={followUpStyles.updateBadgeText}>Follow-up #{index + 1}</Text>
                  </View>
                  <Text style={followUpStyles.updateTimestamp}>
                    {formatRelativeTime(update.created_at)}
                  </Text>
                </View>
                <Text style={followUpStyles.updateDescription}>{update.description}</Text>
                {/* Update Media (images from follow-up) */}
                {update.images && update.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={followUpStyles.updateMediaContainer}
                  >
                    {update.images.map((imageUrl, mediaIndex) => (
                      <Image
                        key={mediaIndex}
                        source={{ uri: imageUrl }}
                        style={followUpStyles.updateMediaImage}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}

            {!showAllUpdates && report.relatedReports.length > FOLLOW_UP_LIMIT && (
              <TouchableOpacity
                style={followUpStyles.seeMoreUpdatesButton}
                onPress={() => setShowAllUpdates(true)}
              >
                <Text style={followUpStyles.seeMoreUpdatesText}>
                  See {report.relatedReports.length - FOLLOW_UP_LIMIT} more updates
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.primary.blue} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Reported Date Card */}
      <Animated.View entering={FadeInUp.delay(550).duration(500)} style={styles.dateSection}>
        <View style={styles.dateInfo}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.text.secondary}
            style={styles.dateIcon}
          />
          <View>
            <Text style={styles.dateLabel}>Reported</Text>
            <Text style={styles.dateValue}>{formatDateReadable(report.timestamp)}</Text>
            <Text style={styles.dateTime}>{formatTime12Hour(report.timestamp)}</Text>
          </View>
        </View>
        <Text style={styles.relativeTime}>Most recent update</Text>
      </Animated.View>

      {/* Location with Map (below status + reported card) */}
      <Animated.View entering={FadeInDown.delay(540).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color={colors.primary.blue} />
            <Text style={styles.locationText}>{report.location}</Text>
          </View>
          {mapRegion && coords && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onMapPress}
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
      </Animated.View>

      {/* Remarks Input + Action Buttons */}
      {(report.status === 'pending' || report.status === 'acknowledged') && (
        <Animated.View
          entering={FadeInUp.delay(580).duration(500)}
          style={[styles.section, { marginBottom: spacing.lg }]}
        >
          {/* Remarks Input */}
          <View style={remarksStyles.remarksSection}>
            <Text style={remarksStyles.remarksLabel}>
              {report.status === 'pending' ? 'Remarks (Optional)' : 'Resolution Notes (Optional)'}
            </Text>
            <View style={remarksStyles.remarksInputContainer}>
              <TextInput
                style={remarksStyles.remarksInput}
                placeholder={
                  report.status === 'pending' 
                    ? "Add any notes or observations about this report..." 
                    : "Describe how the concern was resolved..."
                }
                placeholderTextColor={colors.text.tertiary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={remarksStyles.characterCount}>
                {remarks.length}/500
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={actionButtonStyles.buttonRow}>
            {/* Reject Button */}
            <TouchableOpacity
              style={actionButtonStyles.rejectButton}
              activeOpacity={0.8}
              onPress={() => setRejectSheetVisible(true)}
            >
              <Ionicons name="close-circle" size={18} color={colors.semantic.error} />
              <Text style={actionButtonStyles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            {/* Primary Action Button */}
            {report.status === 'pending' && (
              <TouchableOpacity 
                style={actionButtonStyles.primaryButton} 
                activeOpacity={0.8} 
                onPress={() => {
                  onAcknowledge(remarks.trim() || undefined);
                  setRemarks('');
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.text.inverse} />
                <Text style={actionButtonStyles.primaryButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
            {report.status === 'acknowledged' && (
              <TouchableOpacity
                style={[actionButtonStyles.primaryButton, actionButtonStyles.resolveButton]}
                activeOpacity={0.8}
                onPress={() => {
                  onResolve(remarks.trim() || undefined);
                  setRemarks('');
                }}
              >
                <Ionicons name="checkmark-done-circle" size={18} color={colors.text.inverse} />
                <Text style={actionButtonStyles.primaryButtonText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Resolved Status */}
      {report.status === 'resolved' && (
        <Animated.View
          entering={FadeInUp.delay(580).duration(500)}
          style={[styles.section, { marginBottom: spacing.lg }]}
        >
          <View style={statusBannerStyles.resolvedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
            <Text style={statusBannerStyles.resolvedText}>Report resolved</Text>
          </View>
        </Animated.View>
      )}

      {/* Rejected Status */}
      {report.status === 'rejected' && (
        <Animated.View
          entering={FadeInUp.delay(580).duration(500)}
          style={[styles.section, { marginBottom: spacing.lg }]}
        >
          <View style={statusBannerStyles.rejectedBanner}>
            <Ionicons name="close-circle" size={24} color={colors.semantic.error} />
            <View style={statusBannerStyles.rejectedTextContainer}>
              <Text style={statusBannerStyles.rejectedText}>Report rejected</Text>
              <Text style={statusBannerStyles.rejectedSubtext}>This concern was marked as invalid</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Reject Sheet Modal */}
      <RejectSheet
        visible={rejectSheetVisible}
        report={report}
        onConfirm={(reason) => {
          onReject(reason);
          setRejectSheetVisible(false);
        }}
        onCancel={() => setRejectSheetVisible(false)}
      />
    </ScrollView>
  );
}

// Styles for Remarks Input section
const remarksStyles = StyleSheet.create({
  remarksSection: {
    marginBottom: spacing.md,
  },
  remarksLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remarksInputContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
  },
  remarksInput: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    minHeight: 80,
    maxHeight: 120,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
    paddingRight: spacing.sm,
  },
});

// Styles for Follow-up Activity section
const followUpStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  updatesContainer: {
    gap: spacing.sm,
  },
  updateCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
  },
  updateCardWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    borderRadius: 0,
    marginBottom: spacing.sm,
    paddingBottom: spacing.md,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  updateBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#059669',
  },
  updateTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  updateDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.primary,
  },
  updateMediaContainer: {
    marginTop: spacing.sm,
  },
  updateMediaImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: spacing.sm,
    backgroundColor: colors.border.light,
  },
  seeMoreUpdatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.blue + '10',
    borderRadius: 12,
    marginTop: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.blue + '30',
  },
  seeMoreUpdatesText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.blue,
  },
});

// Styles for Action Buttons (new layout with reject)
const actionButtonStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.semantic.error + '10',
    borderWidth: 1,
    borderColor: colors.semantic.error + '30',
    gap: spacing.xs,
  },
  rejectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.semantic.error,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.primary.blue,
    gap: spacing.xs,
  },
  resolveButton: {
    backgroundColor: colors.semantic.success,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});

// Styles for Status Banners
const statusBannerStyles = StyleSheet.create({
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.success + '15',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  resolvedText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.semantic.success,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '10',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.semantic.error + '20',
  },
  rejectedTextContainer: {
    flex: 1,
  },
  rejectedText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.semantic.error,
  },
  rejectedSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.error + 'CC',
    marginTop: 2,
  },
});


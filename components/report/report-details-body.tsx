import { reportDetailsStyles as styles } from '@/app/report-details.styles';
import { RejectSheet } from '@/components/news/reject-sheet';
import { ImageViewer } from '@/components/ui/image-viewer';
import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import {
  cleanTitle,
  formatDateReadable,
  formatReportId,
  formatTime12Hour,
  getStatusColor,
} from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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

// Helper component for follow-up images with error handling
// Hides images that fail to load instead of showing blank grey boxes
function FollowUpImage({ uri }: { uri: string }) {
  const [hasError, setHasError] = useState(false);
  if (hasError) return null;
  return (
    <Image
      source={{ uri }}
      style={{
        width: 120,
        height: 90,
        borderRadius: 8,
        marginRight: 8,
        backgroundColor: '#e5e7eb',
      }}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

function FollowUpImages({ images, isImageUrl }: { images?: string[]; isImageUrl: (url: string) => boolean }) {
  const validImages = images?.filter(isImageUrl) || [];
  if (validImages.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8 }}
    >
      {validImages.map((imageUrl, mediaIndex) => (
        <FollowUpImage key={mediaIndex} uri={imageUrl} />
      ))}
    </ScrollView>
  );
}

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
  const [canForceResolve, setCanForceResolve] = useState(false);

  // Check for resolve unlock on awaiting_confirmation status
  // Unlock when: citizen confirmed (resolutionConfirmedAt set) OR 2 hours passed
  useEffect(() => {
    if (report.status === 'awaiting_confirmation') {
      // Immediate unlock if citizen already confirmed
      if (report.resolutionConfirmedAt) {
        setCanForceResolve(true);
        return;
      }

      // Use resolutionRequestedAt for accurate timing, fallback to lastUpdated
      const referenceTime = report.resolutionRequestedAt || report.lastUpdated;
      if (!referenceTime) {
        setCanForceResolve(false);
        return;
      }

      const checkTime = () => {
        const diff = Date.now() - new Date(referenceTime).getTime();
        // 2 hours in milliseconds
        const twoHoursMs = 2 * 60 * 60 * 1000;
        setCanForceResolve(diff >= twoHoursMs);
      };

      // Initial check
      checkTime();

      // Check every minute
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    } else {
      setCanForceResolve(false);
    }
  }, [report.status, report.lastUpdated, report.resolutionRequestedAt, report.resolutionConfirmedAt]);

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
  const audioExtensions = ['.m4a', '.mp3', '.wav', '.ogg', '.aac', '.flac'];
  const isImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const lowerUrl = url.toLowerCase();
    // Exclude audio files
    if (audioExtensions.some((ext) => lowerUrl.includes(ext))) return false;
    // Include known image extensions
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  };
  const validImages = report.images?.filter(isImageUrl) || [];

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

      {/* Title Section with Priority */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>What happened?</Text>
        <View style={styles.titleHeader}>
          <Text style={styles.titleText}>{cleanTitle(report.title)}</Text>
          <View style={[styles.priorityBadgeSmall, { backgroundColor: severityColor + '20' }]}>
            <Text style={[styles.priorityBadgeSmallText, { color: severityColor }]}>
              {report.severity.toUpperCase()}
            </Text>
          </View>
        </View>
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

      {/* Status Timeline - only shows phases that have been reached */}
      <Animated.View entering={FadeInDown.delay(420).duration(500)} style={styles.timelineSection}>
        <View style={styles.timelineHeader}>
          <Ionicons name="time-outline" size={18} color={colors.primary.blue} />
          <Text style={styles.timelineTitle}>Status Timeline</Text>
        </View>
        <View style={[styles.timelineList, styles.timelineContainer]}>
          {statusSteps
            .filter((step) => {
              // Only show steps that have been reached based on current status
              if (report.status === 'pending') {
                return step.key === 'pending';
              }
              if (report.status === 'acknowledged') {
                return step.key === 'pending' || step.key === 'acknowledged';
              }
              if (report.status === 'resolved') {
                return step.key === 'pending' || step.key === 'acknowledged' || step.key === 'resolved' || step.key === 'awaiting_confirmation';
              }
              if (report.status === 'awaiting_confirmation') {
                return step.key === 'pending' || step.key === 'acknowledged' || step.key === 'awaiting_confirmation';
              }
              // For rejected status, show pending + rejected
              if (report.status === 'rejected') {
                return step.key === 'pending';
              }
              return false;
            })
            .map((step, index, filteredSteps) => {
              const statusColor = getStatusColor(step.key);
              const isLastStep = index === filteredSteps.length - 1;
              const isCurrentStep = step.key === report.status;

              // Determine timestamp for each step
              let stepTimestamp = '';
              if (step.key === 'pending') {
                // Pending always shows the report creation time
                stepTimestamp = `${formatDateReadable(report.timestamp)} • ${formatTime12Hour(report.timestamp)}`;
              } else if (isCurrentStep) {
                // Current step shows "Current" badge instead of timestamp
                stepTimestamp = '';
              }

              return (
                <View
                  key={step.key}
                  style={styles.timelineItem}
                >
                  <View style={styles.timelineIconContainer}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: statusColor.borderColor },
                      ]}
                    />
                    {!isLastStep && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeaderRow}>
                      <Text style={styles.timelineStatus}>{step.label}</Text>
                      {isCurrentStep && step.key !== 'pending' ? (
                        <View style={[styles.currentStatusBadge, { backgroundColor: statusColor.borderColor + '20' }]}>
                          <Text style={[styles.currentStatusText, { color: statusColor.borderColor }]}>Current</Text>
                        </View>
                      ) : stepTimestamp ? (
                        <Text style={styles.timelineTimestamp}>{stepTimestamp}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.timelineDescription}>
                      {step.description}
                    </Text>
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
                {/* Voice Follow-up Badge */}
                {(update.report_type === 'voice' || update.audio) && (
                  <View style={followUpStyles.voiceBadge}>
                    <Ionicons name="mic" size={14} color="#6366f1" />
                    <Text style={followUpStyles.voiceBadgeText}>VOICE FOLLOW-UP</Text>
                  </View>
                )}
                {/* Follow-up Title (if available) */}
                {update.title && (
                  <Text style={followUpStyles.updateTitle}>{update.title}</Text>
                )}
                <Text style={followUpStyles.updateDescription}>{update.description}</Text>
                {/* Voice Recording Player (if audio available) */}
                {update.audio && (
                  <TouchableOpacity
                    style={followUpStyles.audioPlayerRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (update.audio) {
                        Linking.openURL(update.audio).catch(err => {
                          console.error('Error opening audio URL:', err);
                        });
                      }
                    }}
                  >
                    <View style={followUpStyles.audioPlayButton}>
                      <Ionicons name="play" size={16} color={colors.text.inverse} />
                    </View>
                    <View style={followUpStyles.audioDetails}>
                      <Text style={followUpStyles.audioFileName} numberOfLines={1}>
                        {update.audio.split('/').pop() || 'Voice Recording'}
                      </Text>
                      <Text style={followUpStyles.audioTapHint}>Tap to play recording</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {/* Update Media (images from follow-up) - filter out audio and broken images */}
                <FollowUpImages images={update.images} isImageUrl={isImageUrl} />
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
      {(report.status === 'pending' || report.status === 'acknowledged' || report.status === 'awaiting_confirmation') && (
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
                    : report.status === 'awaiting_confirmation'
                      ? "Reason for forcing resolution..."
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
            {/* Reject Button - only show on pending status */}
            {report.status === 'pending' && (
              <TouchableOpacity
                style={actionButtonStyles.rejectButton}
                activeOpacity={0.8}
                onPress={() => setRejectSheetVisible(true)}
              >
                <Ionicons name="close-circle" size={16} color={colors.semantic.error} />
                <Text style={actionButtonStyles.rejectButtonText} numberOfLines={1} adjustsFontSizeToFit>False Alarm</Text>
              </TouchableOpacity>
            )}

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
            {/* Resolve Button - Show if Acknowledged or Awaiting Confirmation */}
            {(report.status === 'acknowledged' || report.status === 'awaiting_confirmation') && (
              <TouchableOpacity
                style={[
                  actionButtonStyles.primaryButton,
                  actionButtonStyles.resolveButton,
                  // Locked styling when awaiting_confirmation and not yet unlocked
                  report.status === 'awaiting_confirmation' && !canForceResolve
                    ? { opacity: 0.5, backgroundColor: colors.background.accent, borderColor: colors.border.default, borderWidth: 1 }
                    : {}
                ]}
                activeOpacity={0.8}
                disabled={report.status === 'awaiting_confirmation' && !canForceResolve}
                onPress={() => {
                  onResolve(remarks.trim() || undefined);
                  setRemarks('');
                }}
              >
                <Ionicons
                  name={report.status === 'awaiting_confirmation' && !canForceResolve ? "lock-closed" : "checkmark-done-circle"}
                  size={18}
                  color={report.status === 'awaiting_confirmation' && !canForceResolve ? colors.text.secondary : colors.text.inverse}
                />
                <Text style={[
                  actionButtonStyles.primaryButtonText,
                  report.status === 'awaiting_confirmation' && !canForceResolve
                    ? { color: colors.text.secondary }
                    : {}
                ]}>
                  Mark as Resolved
                </Text>
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

      {/* Awaiting Citizen Confirmation Status */}
      {report.status === 'awaiting_confirmation' && (
        <Animated.View
          entering={FadeInUp.delay(580).duration(500)}
          style={[styles.section, { marginBottom: spacing.lg }]}
        >
          <View style={statusBannerStyles.awaitingBanner}>
            <Ionicons
              name={report.resolutionConfirmedAt ? "checkmark-circle" : "hourglass-outline"}
              size={24}
              color={report.resolutionConfirmedAt ? "#16A34A" : "#F97316"}
            />
            <View style={statusBannerStyles.awaitingTextContainer}>
              <Text style={statusBannerStyles.awaitingText}>
                {report.resolutionConfirmedAt
                  ? "Citizen Confirmed Resolution"
                  : "Awaiting Citizen Confirmation"}
              </Text>
              <Text style={statusBannerStyles.awaitingSubtext}>
                {report.resolutionConfirmedAt
                  ? "The citizen has confirmed. You may now mark this concern as resolved."
                  : "The citizen needs to confirm that this concern has been resolved."}
              </Text>
            </View>
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
  // Voice follow-up badge
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  voiceBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  // Follow-up title
  updateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  // Audio player row for follow-up voice recordings
  audioPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDetails: {
    flex: 1,
  },
  audioFileName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  audioTapHint: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 1,
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
  awaitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F9731630',
  },
  awaitingTextContainer: {
    flex: 1,
  },
  awaitingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#F97316',
  },
  awaitingSubtext: {
    fontSize: typography.fontSize.sm,
    color: '#EA580C',
    marginTop: 2,
  },
});


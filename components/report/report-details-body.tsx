import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ImageViewer } from '@/components/ui/image-viewer';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { EmergencyReport } from '@/types';
import { DesignSystem } from '@/constants/design-system';
import {
  cleanTitle,
  formatDateReadable,
  formatReportId,
  formatTime12Hour,
} from '@/utils/reportHelpers';
import { reportDetailsStyles as styles } from '@/app/report-details.styles';

const { colors, spacing } = DesignSystem;

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
  onAcknowledge: () => Promise<void>;
  onResolve: () => Promise<void>;
  onMapPress: () => void;
  onPlayAudio: () => Promise<void>;
  onStopAudio: () => Promise<void>;
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
  onMapPress,
  onPlayAudio,
  onStopAudio,
}: ReportDetailsBodyProps) {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

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
              {report.transcript ? (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>{report.transcript}</Text>
                </View>
              ) : report.transcriptionStatus === 'failed' ? (
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

      {/* Citizen Feed (Merged Reports) */}
      {report.relatedReports && report.relatedReports.length > 0 && (
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.citizenFeedSection}>
          <View style={styles.citizenFeedHeader}>
            <Ionicons name="people" size={20} color={colors.primary.blue} />
            <Text style={styles.sectionLabel}>More reports for this incident</Text>
          </View>

          {report.relatedReports.map((item, index) => (
            <View key={item.id.toString()} style={styles.feedItem}>
              <Text style={styles.feedCitizenName}>{item.citizen_name || 'Anonymous citizen'}</Text>
              <Text style={styles.feedTimeMeta}>
                Reported {formatDateReadable(new Date(item.created_at))} {formatTime12Hour(new Date(item.created_at))}
              </Text>
              <Text style={styles.feedDescription}>{item.description}</Text>

              {item.images && item.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feedImageGallery}>
                  {item.images.map((img, imgIdx) => (
                    <TouchableOpacity
                      key={imgIdx}
                      onPress={() => {
                        // For simplicity, we just use the first image for now or append to viewer
                        // In a real app, we'd handle this better
                      }}
                      style={[styles.imageContainer, { width: 80, height: 80 }]}
                    >
                      <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
        </Animated.View>
      )}

      {/* Images Gallery */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
        <Text style={styles.sectionLabel}>Photos from citizen</Text>
        {report.images && report.images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            contentContainerStyle={styles.imageGalleryContent}
          >
            {report.images.map((imageUrl, index) => (
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
      {report.images && report.images.length > 0 && (
        <ImageViewer
          images={report.images}
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

      {/* Reported Date Card */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.dateSection}>
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

      {/* Action Buttons at very bottom */}
      <Animated.View
        entering={FadeInUp.delay(580).duration(500)}
        style={[styles.section, { marginBottom: spacing.lg }]}
      >
        {report.status === 'pending' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={onAcknowledge}>
            <Text style={styles.actionButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        {report.status === 'acknowledged' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonResolve]}
            activeOpacity={0.8}
            onPress={onResolve}
          >
            <Text style={styles.actionButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
        )}
        {report.status === 'resolved' && (
          <Text style={styles.resolvedText}>Report resolved</Text>
        )}
      </Animated.View>
    </ScrollView>
  );
}



/**
 * Map Info Card Component
 * 
 * Shows incident details when a marker is selected.
 * 
 * PRIVACY LOGIC:
 * - If status is "acknowledged" or "resolved" → Show evidence photos
 * - If status is "pending" or unknown → Hide photos, show privacy message
 */

import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import { getMarkerIcon, type SelectedMarker } from '@/utils/mapHelpers';
import { getSeverityColor } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mapStyles as styles } from '@/constants/map-screen.styles';
import { ImageViewer } from '@/components/ui/image-viewer';

const { colors } = DesignSystem;

interface InfoCardProps {
  marker: NonNullable<SelectedMarker>;
  onClose: () => void;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp?: Date): string {
  if (!timestamp) return 'Time not available';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return 'Time not available';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function InfoCard({ marker, onClose }: InfoCardProps) {
  // Check if incident is verified (acknowledged or resolved)
  const isVerified = marker.status === 'acknowledged' || marker.status === 'resolved';
  const hasImages = marker.images && marker.images.length > 0;

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  return (
    <View style={styles.infoCardContainer}>
      <Pressable style={styles.infoCardBackdrop} onPress={onClose} />
      <View style={styles.infoCard}>
        {/* Close button */}
        <Pressable style={styles.infoCardClose} onPress={onClose}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>

        {/* Status Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons 
            name={isVerified ? "shield-checkmark" : "time-outline"} 
            size={14} 
            color={isVerified ? "#10B981" : "#F59E0B"} 
          />
          <Text style={[styles.privacyNoticeText, { color: isVerified ? "#10B981" : "#F59E0B" }]}>
            {isVerified ? "Verified Incident" : "Pending Verification"}
          </Text>
        </View>

        {/* Header with Generic Icon */}
        <View style={styles.infoCardHeader}>
          <View style={[styles.infoCardIcon, { backgroundColor: marker.color }]}>
            <Ionicons name={getMarkerIcon(marker.type)} size={24} color="white" />
          </View>
          <View style={styles.infoCardHeaderText}>
            <Text style={styles.infoCardTitle} numberOfLines={1}>
              {marker.title}
            </Text>
            <Text style={styles.infoCardLocation} numberOfLines={1}>
              📍 {marker.location}
            </Text>
          </View>
        </View>

        {/* Description - Show actual incident details */}
        {marker.description && marker.description.length > 0 && (
          <View style={styles.descriptionRow}>
            <Text style={styles.descriptionText}>{marker.description}</Text>
          </View>
        )}

        {/* Evidence Photos - Only shown if VERIFIED */}
        {isVerified && hasImages && (
          <View style={styles.evidenceSection}>
            <View style={styles.evidenceHeader}>
              <Ionicons name="images-outline" size={16} color="#3B82F6" />
              <Text style={styles.evidenceHeaderText}>Evidence Photos</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.evidenceScroll}
            >
              {marker.images!.map((imageUrl, index) => (
                <Pressable 
                  key={index} 
                  style={styles.evidenceImageContainer}
                  onPress={() => handleImagePress(index)}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.evidenceImage}
                    contentFit="cover"
                  />
                  <View style={localStyles.imageTapHint}>
                    <Ionicons name="expand-outline" size={12} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Image Viewer Modal */}
        {hasImages && (
          <ImageViewer
            images={marker.images!}
            initialIndex={selectedImageIndex}
            visible={imageViewerVisible}
            onClose={() => setImageViewerVisible(false)}
          />
        )}

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.timestampText}>{formatTimestamp(marker.timestamp)}</Text>
        </View>

        {/* Badges: Type + Severity */}
        <View style={styles.infoCardBadges}>
          <View style={[styles.infoCardBadge, { backgroundColor: colors.primary.blue }]}>
            <Text style={styles.infoCardBadgeText}>{marker.type.toUpperCase()}</Text>
          </View>
          <View
            style={[
              styles.infoCardBadge,
              { backgroundColor: getSeverityColor(marker.severity as EmergencyReport['severity']) },
            ]}
          >
            <Text style={styles.infoCardBadgeText}>{marker.severity.toUpperCase()}</Text>
          </View>
        </View>

        {/* Privacy Notice - Only shown if NOT verified OR no images */}
        {(!isVerified || !hasImages) && (
          <View style={styles.infoPrivacyBox}>
            <Ionicons name="eye-off-outline" size={18} color="#6B7280" />
            <Text style={styles.infoPrivacyText}>
              {!isVerified 
                ? "Evidence photos will be available once the incident is verified."
                : "No evidence photos available for this incident."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  imageTapHint: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    padding: 3,
  },
});



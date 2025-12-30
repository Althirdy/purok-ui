/**
 * Map Info Card Component - PRIVACY SAFE
 * 
 * Shows incident details when a marker is selected.
 * IMPORTANT: This component intentionally HIDES:
 * - Photos/Evidence images (privacy protection)
 * - Personal information of people involved
 * 
 * Shows ONLY: Title, Time, Location, Severity, Type
 */

import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import { getMarkerIcon, type SelectedMarker } from '@/utils/mapHelpers';
import { getSeverityColor } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/app/(tabs)/map.styles';

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
  // NOTE: View Details button removed intentionally for citizen privacy
  // Citizens should NOT be able to see full report details including photos

  return (
    <View style={styles.infoCardContainer}>
      <Pressable style={styles.infoCardBackdrop} onPress={onClose} />
      <View style={styles.infoCard}>
        {/* Close button */}
        <Pressable style={styles.infoCardClose} onPress={onClose}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.privacyNoticeText}>Verified Incident • Privacy Protected</Text>
        </View>

        {/* Header with Generic Icon (no photo) */}
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

        {/* Timestamp - Important for heatmap context */}
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

        {/* Info Text (replaces View Details button for privacy) */}
        <View style={styles.infoPrivacyBox}>
          <Ionicons name="eye-off-outline" size={18} color="#6B7280" />
          <Text style={styles.infoPrivacyText}>
            Evidence photos are hidden to protect privacy of individuals involved.
          </Text>
        </View>
      </View>
    </View>
  );
}



/**
 * Map Info Card Component
 * Shows details when a marker is selected
 */

import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import { getMarkerIcon, type SelectedMarker } from '@/utils/mapHelpers';
import { getSeverityColor } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/app/(tabs)/map.styles';

const { colors } = DesignSystem;

interface InfoCardProps {
  marker: NonNullable<SelectedMarker>;
  onClose: () => void;
}

export function InfoCard({ marker, onClose }: InfoCardProps) {
  const handleViewDetails = () => {
    onClose();
    router.push({
      pathname: '/report-details',
      params: { reportId: marker.id },
    } as any);
  };

  return (
    <View style={styles.infoCardContainer}>
      <Pressable style={styles.infoCardBackdrop} onPress={onClose} />
      <View style={styles.infoCard}>
        {/* Close button */}
        <Pressable style={styles.infoCardClose} onPress={onClose}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>

        {/* Header */}
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

        {/* Description */}
        <Text style={styles.infoCardDescription} numberOfLines={2}>
          {marker.description}
        </Text>

        {/* Badges */}
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

        {/* View Details Button */}
        <Pressable style={styles.infoCardButton} onPress={handleViewDetails}>
          <Text style={styles.infoCardButtonText}>View Full Details</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </Pressable>
      </View>
    </View>
  );
}



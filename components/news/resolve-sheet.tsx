import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import {
  formatReportId,
  formatDateReadable,
  formatTime12Hour,
  getCategory,
  getSeverityColor,
  getStatusText,
  cleanTitle,
} from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

export interface ResolveSheetProps {
  visible: boolean;
  report: EmergencyReport | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResolveSheet({ visible, report, onConfirm, onCancel }: ResolveSheetProps) {
  if (!report) return null;

  const severityColor = getSeverityColor(report.severity);

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

  const coords = report.coordinates || parseCoordinates(report.location);
  const mapRegion = coords ? {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark-done-circle" size={28} color={colors.semantic.success} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Mark as Resolved</Text>
                <Text style={styles.modalSubtitle}>Confirm that this concern has been addressed</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Report Insights */}
          <ScrollView 
            style={styles.insightsContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Report ID Badge */}
            <View style={styles.idBadgeContainer}>
              <Text style={styles.idLabel}>Report ID</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>{formatReportId(report.id)}</Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Concern</Text>
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
                {mapRegion && (
                  <View style={styles.mapContainer}>
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
                          latitude: coords!.latitude,
                          longitude: coords!.longitude,
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
                  </View>
                )}
              </View>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                  <Text style={[styles.severityBadgeText, { color: severityColor }]}>
                    {report.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.infoLabel}>Priority</Text>
              </View>
              {report.source && (
                <View style={styles.infoItem}>
                  <Ionicons 
                    name={report.source === 'citizen' ? 'people' : report.source === 'sensor' ? 'hardware-chip' : 'videocam'} 
                    size={18} 
                    color={colors.text.secondary} 
                  />
                  <Text style={styles.infoLabel}>Source</Text>
                  <Text style={styles.infoValue}>
                    {report.source === 'sensor' ? 'Sensor Box' : 
                     report.source === 'cctv' ? 'CCTV' : 
                     report.source === 'citizen' ? 'Citizen' : 
                     report.source}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirmation Message */}
            <View style={styles.confirmationBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary.blue} />
              <Text style={styles.confirmationText}>
                By marking this as resolved, you confirm that the concern has been fully addressed and no further action is needed.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              activeOpacity={0.8}
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              activeOpacity={0.8}
              onPress={onConfirm}
            >
              <Ionicons name="checkmark-done-circle" size={20} color={colors.text.inverse} style={{ marginRight: 8 }} />
              <Text style={styles.modalButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.xl,
    // Extra bottom padding so primary button text isn't clipped by gesture bar
    paddingBottom: Platform.OS === 'ios' ? 48 : spacing.xl + spacing.sm,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.semantic.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  insightsContainer: {
    maxHeight: 500,
    marginBottom: spacing.lg,
  },
  idBadgeContainer: {
    marginBottom: spacing.lg,
  },
  idLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  idText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: spacing.lg,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.lg * 1.4,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: typography.fontSize.base * 1.5,
  },
  imageGallery: {
    marginTop: spacing.sm,
  },
  imageGalleryContent: {
    gap: spacing.md,
  },
  imageContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  locationCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  mapContainer: {
    marginTop: spacing.sm,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  mapCoordinates: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
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
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  severityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  confirmationBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary.blue + '10',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.blue + '30',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  confirmationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingHorizontal: spacing.xs,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalButtonPrimary: {
    backgroundColor: colors.semantic.success,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  modalButtonTextSecondary: {
    color: colors.text.primary,
  },
});


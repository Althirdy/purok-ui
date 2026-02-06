/**
 * Anomaly Details Screen - Detailed view of IoT anomaly logs
 */

import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { fetchAnomalyById } from '@/services/anomaly-service';
import type { AnomalyLog, AnomalyType } from '@/types/anomaly';
import { getIoTBoxDisplayName, getIoTBoxLocation, getLocationDisplay } from '@/types/anomaly';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, spacing, typography } = DesignSystem;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get icon for anomaly type
function getAnomalyIcon(type: AnomalyType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'sound_anomaly':
      return 'volume-high';
    case 'anti_tampering':
      return 'warning';
    default:
      return 'alert-circle';
  }
}

// Get color for anomaly type
function getAnomalyColor(type: AnomalyType): string {
  switch (type) {
    case 'sound_anomaly':
      return '#8b5cf6'; // Purple
    case 'anti_tampering':
      return '#ef4444'; // Red
    default:
      return '#64748b'; // Gray
  }
}

// Format timestamp
function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Format sensor value
function formatSensorValue(value: string | undefined, unit?: string): string {
  if (!value) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return unit ? `${num.toFixed(2)} ${unit}` : num.toFixed(2);
}

export default function AnomalyDetailsScreen() {
  const params = useLocalSearchParams();
  const anomalyId = Number(params.anomalyId);
  const { accessToken } = useAuth();

  const [anomaly, setAnomaly] = useState<AnomalyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [imageError, setImageError] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Fetch anomaly details
  const fetchDetails = useCallback(async () => {
    if (!accessToken || !anomalyId) return;

    try {
      const anomalyData = await fetchAnomalyById(accessToken, anomalyId);
      console.log('[AnomalyDetails] Received anomaly data:', JSON.stringify(anomalyData, null, 2));
      if (anomalyData) {
        setAnomaly(anomalyData);
      }
    } catch (error) {
      console.error('[AnomalyDetails] Error fetching anomaly:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, anomalyId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails();
  }, [fetchDetails]);



  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anomaly Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading anomaly details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!anomaly) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Anomaly Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.notFoundText}>Anomaly not found</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safe to access anomaly properties after null check
  const iconColor = getAnomalyColor(anomaly.anomaly_type);
  const isPending = !anomaly.is_confirmed;

  // Get location from various possible sources
  const locationDisplay = getLocationDisplay(anomaly.location) ||
    getIoTBoxLocation(anomaly.iot_box) ||
    (anomaly.iot_box as any)?.display_location ||
    (anomaly.iot_box as any)?.location_name ||
    (anomaly as any)?.location_name ||
    null;

  // Get device name from various possible fields
  // Check iot_box relation first, then direct fields on anomaly
  const deviceName = getIoTBoxDisplayName(anomaly.iot_box) ||
    (anomaly.iot_box as any)?.device_name ||
    (anomaly.iot_box as any)?.name ||
    (anomaly as any)?.device_name ||
    anomaly.device_id ||  // Use device_id directly (e.g., "Device_01")
    (anomaly.iot_box_id ? `IoT Box #${anomaly.iot_box_id}` : 'Unknown Device');

  // Get anomaly type label (API may or may not provide it)
  const anomalyTypeLabel = anomaly.anomaly_type_label ||
    (anomaly.anomaly_type === 'sound_anomaly' ? 'Sound Anomaly' :
      anomaly.anomaly_type === 'anti_tampering' ? 'Anti-Tampering Alert' : 'Unknown Anomaly');

  const anomalyTypeDisplay = anomaly.anomaly_type ?
    anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase() : 'IOT ANOMALY';

  // Use image_url from API if available, otherwise construct from image path
  const imageUrl = anomaly.image_url ||
    (anomaly.image ? `${process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me'}/storage/${anomaly.image}` : null);

  // Format timestamp safely
  const formattedTimestamp = anomaly.created_at ? formatTimestamp(anomaly.created_at) : 'Unknown time';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anomaly Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ID Badge */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.idBadgeContainer}
        >
          <Text style={styles.idLabel}>ANOMALY ID</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>#{anomaly.id}</Text>
          </View>
        </Animated.View>

        {/* Type & Status Section */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.section}
        >
          <View style={styles.typeHeader}>
            <View style={[styles.typeIconContainer, { backgroundColor: iconColor + '15' }]}>
              <Ionicons name={getAnomalyIcon(anomaly.anomaly_type)} size={32} color={iconColor} />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeTitle}>{anomalyTypeLabel}</Text>
              <Text style={styles.typeSubtitle}>
                {anomalyTypeDisplay}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isPending ? '#fef3c7' : '#d1fae5' }]}>
              <Text style={[styles.statusText, { color: isPending ? '#b45309' : '#047857' }]}>
                {isPending ? 'Pending' : 'Confirmed'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Image Section (if available) */}
        {imageUrl && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>CAPTURED IMAGE</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => !imageError && setImageModalVisible(true)}
              activeOpacity={0.8}
            >
              {imageError ? (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color={colors.text.tertiary} />
                  <Text style={styles.imagePlaceholderText}>Image unavailable</Text>
                  <Text style={styles.imagePlaceholderSubtext}>403 - Access denied</Text>
                </View>
              ) : (
                <>
                  <Image
                    source={{
                      uri: imageUrl,
                      headers: {
                        'ngrok-skip-browser-warning': '69420',
                      }
                    }}
                    style={styles.anomalyImage}
                    contentFit="cover"
                    onError={(e) => {
                      console.log('[AnomalyDetails] Image load error:', e);
                      setImageError(true);
                    }}
                  />
                  <View style={styles.tapToViewOverlay}>
                    <Ionicons name="expand-outline" size={20} color="#ffffff" />
                    <Text style={styles.tapToViewText}>Tap to view</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Device Info Section */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionLabel}>DEVICE INFORMATION</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="hardware-chip-outline" size={20} color={colors.primary.blue} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>IoT Box</Text>
              <Text style={styles.infoValue}>{deviceName}</Text>
            </View>
          </View>

          {locationDisplay && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={20} color={colors.accent.orange} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{locationDisplay}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Detected At</Text>
              <Text style={styles.infoValue}>{formattedTimestamp}</Text>
            </View>
          </View>

          {anomaly.device_id && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="barcode-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Device ID</Text>
                <Text style={[styles.infoValue, styles.monoText]}>{anomaly.device_id}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Sensor Details Section */}
        {anomaly.details && anomaly.details.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.section}
          >
            <Text style={styles.sectionLabel}>SENSOR READINGS</Text>
            <View style={styles.sensorGrid}>
              {anomaly.details[0].mic_left && (
                <View style={styles.sensorCard}>
                  <Ionicons name="mic-outline" size={24} color="#8b5cf6" />
                  <Text style={styles.sensorLabel}>Left Mic</Text>
                  <Text style={styles.sensorValue}>{formatSensorValue(anomaly.details[0].mic_left)}</Text>
                </View>
              )}
              {anomaly.details[0].mic_right && (
                <View style={styles.sensorCard}>
                  <Ionicons name="mic-outline" size={24} color="#8b5cf6" />
                  <Text style={styles.sensorLabel}>Right Mic</Text>
                  <Text style={styles.sensorValue}>{formatSensorValue(anomaly.details[0].mic_right)}</Text>
                </View>
              )}
              {anomaly.details[0].vibration && (
                <View style={styles.sensorCard}>
                  <Ionicons name="pulse-outline" size={24} color="#ef4444" />
                  <Text style={styles.sensorLabel}>Vibration</Text>
                  <Text style={styles.sensorValue}>{formatSensorValue(anomaly.details[0].vibration)}</Text>
                </View>
              )}
              {anomaly.details[0].hall_effect && (
                <View style={styles.sensorCard}>
                  <Ionicons name="magnet-outline" size={24} color="#10b981" />
                  <Text style={styles.sensorLabel}>Hall Effect</Text>
                  <Text style={styles.sensorValue}>{formatSensorValue(anomaly.details[0].hall_effect)}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Related Anomalies Section (grouped/merged anomalies) */}
        {anomaly.related_anomalies && anomaly.related_anomalies.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(350).duration(400)}
            style={styles.section}
          >
            <View style={styles.relatedHeader}>
              <Ionicons name="git-merge-outline" size={18} color="#7c3aed" />
              <Text style={styles.sectionLabel}>RELATED ANOMALIES ({anomaly.related_anomalies.length})</Text>
            </View>
            <View style={styles.relatedList}>
              {anomaly.related_anomalies.map((related, index) => (
                <View
                  key={related.id}
                  style={[
                    styles.relatedItem,
                    index < anomaly.related_anomalies!.length - 1 && styles.relatedItemBorder
                  ]}
                >
                  <View style={[styles.relatedIconContainer, { backgroundColor: getAnomalyColor(related.anomaly_type) + '15' }]}>
                    <Ionicons
                      name={getAnomalyIcon(related.anomaly_type)}
                      size={18}
                      color={getAnomalyColor(related.anomaly_type)}
                    />
                  </View>
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedTitle}>{related.anomaly_type_label}</Text>
                    <Text style={styles.relatedTime}>{formatTimestamp(related.created_at)}</Text>
                  </View>
                  <View style={styles.relatedIdBadge}>
                    <Text style={styles.relatedIdText}>#{related.id}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}



        {/* Spacer for bottom */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          {imageUrl && (
            <Image
              source={{
                uri: imageUrl,
                headers: {
                  'ngrok-skip-browser-warning': '69420',
                }
              }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
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
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  notFoundText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  goBackButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.blue,
    borderRadius: 8,
  },
  goBackText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  idBadge: {
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  idText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '600',
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
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  typeSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  anomalyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  imagePlaceholderSubtext: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  monoText: {
    fontFamily: 'monospace',
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sensorCard: {
    width: '47%',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  sensorLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  sensorValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Related anomalies styles
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  relatedList: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  relatedItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  relatedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  relatedTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  relatedIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  relatedIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  tapToViewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  tapToViewText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});

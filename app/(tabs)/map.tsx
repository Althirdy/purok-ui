/**
 * Map Screen - View incidents on map (REALTIME)
 * 
 * Uses default Google Maps with native markers for Android reliability.
 * Shows real-time reports from useReportsFeed hook.
 */

import { InfoCard } from '@/components/map/info-card';
import { BARANGAY_176E_BOUNDARY, BARANGAY_176E_REGION } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { getMarkerColor, processMarkersWithJitter, type SelectedMarker } from '@/utils/mapHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './map.styles';

const { colors } = DesignSystem;

export default function MapScreen() {
  const { reports, loading, fetchReports } = useReportsFeed();
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>(null);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports('all');
  }, [fetchReports]);

  // Animate to region on mount
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(BARANGAY_176E_REGION, 1000);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Convert reports to markers (only valid coordinates)
  const reportMarkers = useMemo(() => {
    return reports
      .filter((r: EmergencyReport) => {
        const { latitude: lat, longitude: lng } = r.coordinates ?? {};
        return lat != null && lng != null && !isNaN(lat) && !isNaN(lng) &&
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      })
      .map((r: EmergencyReport) => ({
        id: r.id,
        latitude: r.coordinates!.latitude,
        longitude: r.coordinates!.longitude,
        title: r.title,
        description: r.description,
        type: r.type,
        severity: r.severity,
        location: r.location,
      }));
  }, [reports]);

  // Process markers with jitter for overlapping coordinates
  const displayedMarkers = useMemo(
    () => processMarkersWithJitter(reportMarkers),
    [reportMarkers]
  );

  const handleMarkerPress = (marker: typeof displayedMarkers[0]) => {
    const color = getMarkerColor(marker.type as EmergencyReport['type'], marker.severity as EmergencyReport['severity']);
    setSelectedMarker({
      id: marker.id,
      title: marker.title || 'Incident Report',
      description: marker.description || 'No description available',
      type: marker.type || 'unknown',
      severity: marker.severity || 'low',
      location: marker.location || 'Unknown location',
      color,
    });
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Incident Map</Text>
          <View style={styles.headerActions}>
            <Ionicons name="locate" size={20} color={colors.text.primary} />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>View incidents near you</Text>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={BARANGAY_176E_REGION}
          showsCompass
          onMapReady={() => setMapReady(true)}
        >
          <Polygon
            coordinates={BARANGAY_176E_BOUNDARY.coordinates}
            fillColor={BARANGAY_176E_BOUNDARY.fillColor}
            strokeColor={BARANGAY_176E_BOUNDARY.strokeColor}
            strokeWidth={BARANGAY_176E_BOUNDARY.strokeWidth}
          />

          {mapReady && displayedMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m._lat, longitude: m._lng }}
              pinColor={getMarkerColor(m.type as EmergencyReport['type'], m.severity as EmergencyReport['severity'])}
              title={m.title}
              description={m.location}
              onPress={() => handleMarkerPress(m)}
            />
          ))}
        </MapView>

        {/* Info Card */}
        {selectedMarker && (
          <InfoCard marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.loadingOverlayText}>Updating reports...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

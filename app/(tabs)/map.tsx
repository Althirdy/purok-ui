/**
 * Map Screen - View of Verified Incidents
 * 
 * Shows only verified/acknowledged incidents with markers.
 * No heatmap circles - just clean markers for incident locations.
 * 
 * For Purok Officials: To acknowledge/verify reports for citizen visibility.
 */

import { InfoCard } from '@/components/map/info-card';
import { BARANGAY_176E_BOUNDARY, BARANGAY_176E_REGION } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { mapStyles as styles } from '@/constants/map-screen.styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { getMarkerColor, processMarkersWithJitter, type SelectedMarker } from '@/utils/mapHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  // PRIVACY FILTER: Only show verified/acknowledged incidents (not pending)
  const verifiedReports = useMemo(() => {
    return reports.filter((r: EmergencyReport) => 
      r.status === 'acknowledged' || r.status === 'resolved'
    );
  }, [reports]);

  // Convert verified reports to markers (only valid coordinates)
  const reportMarkers = useMemo(() => {
    return verifiedReports
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
        timestamp: r.timestamp,
        status: r.status,
      }));
  }, [verifiedReports]);

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
      timestamp: marker.timestamp,
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
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.verifiedBadgeText}>Verified Only</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {reportMarkers.length} verified incidents in your area
        </Text>
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
          {/* Barangay Boundary */}
          <Polygon
            coordinates={BARANGAY_176E_BOUNDARY.coordinates}
            fillColor={BARANGAY_176E_BOUNDARY.fillColor}
            strokeColor={BARANGAY_176E_BOUNDARY.strokeColor}
            strokeWidth={BARANGAY_176E_BOUNDARY.strokeWidth}
          />

          {/* Markers only - no heatmap circles */}
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

        {/* Info Card - Privacy Safe (no photos) */}
        {selectedMarker && (
          <InfoCard marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.loadingOverlayText}>Updating...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/**
 * Map Screen - View of Verified/Ongoing Incidents
 * 
 * Shows TWO types of data on the map:
 * 1. Citizen Concerns (acknowledged/resolved by Purok) - Markers
 * 2. CCTV Accidents (In Progress - acknowledged by Operator) - Markers
 * 
 * Data Sources:
 * - Citizen Concerns: GET /api/v1/purok-leader/concerns
 * - CCTV Accidents: GET /api/v1/active-accidents (markers) + GET /api/v1/active-accidents/{id} (details)
 * 
 * PRIVACY LOGIC (unified for both citizen concerns and CCTV accidents):
 * - Photos/images shown ONLY if incident is verified (acknowledged/resolved)
 * - Only verified/acknowledged incidents appear as markers
 * - InfoCard handles the privacy display logic for images
 */

import { InfoCard } from '@/components/map/info-card';
import { MapLegend } from '@/components/map/map-legend';
import { PurokInfoCard } from '@/components/map/purok-info-card';
import { BARANGAY_176E_REGION } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import purokBoundaries from '@/constants/geojson.json';
import { globalStyles } from '@/constants/global-styles';
import { mapStyles as styles } from '@/constants/map-screen.styles';
import { PUROK_COLORS } from '@/constants/purok-colors';
import { useAuth } from '@/context/auth-context';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import { fetchActiveAccidentDetail, fetchActiveAccidentMarkers, markerToEmergencyReport } from '@/services/active-accidents-service';
import { subscribeToAccidentStatusUpdates } from '@/services/realtime-service';
import type { EmergencyReport } from '@/types';
import { getMarkerColor, processMarkersWithJitter, type SelectedMarker } from '@/utils/mapHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

const { colors } = DesignSystem;

export default function MapScreen() {
  // Get auth token for authenticated requests
  const { accessToken } = useAuth();

  // Citizen concerns from Pusher/API
  const { reports, loading: loadingConcerns, fetchReports } = useReportsFeed();

  // CCTV accidents (ongoing)
  const [cctvAccidents, setCctvAccidents] = useState<EmergencyReport[]>([]);
  const [loadingAccidents, setLoadingAccidents] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPurok, setSelectedPurok] = useState<{ name: string; description?: string } | null>(null);

  // Fetch citizen concerns on mount
  useEffect(() => {
    console.log('[MapScreen] Fetching reports...');
    fetchReports('all');
  }, [fetchReports]);

  // Fetch CCTV accidents on mount
  const fetchAccidents = useCallback(async () => {
    if (!accessToken) {
      console.warn('[MapScreen] No auth token, skipping CCTV accidents fetch');
      return;
    }
    setLoadingAccidents(true);
    try {
      console.log('[MapScreen] Fetching CCTV accidents...');
      const markers = await fetchActiveAccidentMarkers(accessToken);
      const converted = markers.map(markerToEmergencyReport);
      setCctvAccidents(converted);
      console.log('[MapScreen] ✅ Loaded', converted.length, 'CCTV accidents');
    } catch (error) {
      console.error('[MapScreen] Error fetching CCTV accidents:', error);
    } finally {
      setLoadingAccidents(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAccidents();
  }, [fetchAccidents]);

  // Refresh data when screen gains focus (e.g., coming back from other screens)
  useFocusEffect(
    useCallback(() => {
      console.log('[MapScreen] 👁️ Screen focused - refreshing data...');
      fetchReports('all');
      fetchAccidents();
    }, [fetchReports, fetchAccidents])
  );

  // Subscribe to real-time accident status updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        unsubscribe = await subscribeToAccidentStatusUpdates((accident) => {
          console.log('[MapScreen] 🔔 Real-time accident update:', accident);

          // If status changed to "In Progress", add/update marker
          if (accident.status === 'In Progress') {
            setCctvAccidents(prev => {
              const existing = prev.find(a => a.id === `accident-${accident.id}`);
              if (existing) {
                // Update existing
                return prev.map(a =>
                  a.id === `accident-${accident.id}`
                    ? {
                      ...a,
                      title: accident.title,
                      coordinates: {
                        latitude: typeof accident.latitude === 'string' ? parseFloat(accident.latitude) : accident.latitude,
                        longitude: typeof accident.longitude === 'string' ? parseFloat(accident.longitude) : accident.longitude,
                      },
                    }
                    : a
                );
              }
              // Add new marker
              const lat = typeof accident.latitude === 'string' ? parseFloat(accident.latitude) : accident.latitude;
              const lng = typeof accident.longitude === 'string' ? parseFloat(accident.longitude) : accident.longitude;
              return [...prev, {
                id: `accident-${accident.id}`,
                type: 'accident' as const,
                title: accident.title,
                description: 'CCTV detected incident',
                location: 'Location pending...',
                timestamp: new Date(),
                status: 'acknowledged' as const,
                severity: (accident.severity?.toLowerCase() || 'medium') as EmergencyReport['severity'],
                source: 'cctv' as const,
                coordinates: { latitude: lat, longitude: lng },
              }];
            });
          }

          // If status changed to "Resolved", remove marker from active
          if (accident.status === 'Resolved') {
            setCctvAccidents(prev => prev.filter(a => a.id !== `accident-${accident.id}`));
          }
        });
        console.log('[MapScreen] ✅ Subscribed to accident real-time updates');
      } catch (error) {
        console.error('[MapScreen] Failed to setup real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Animate to region on mount
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(BARANGAY_176E_REGION, 1000);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchReports('all'),
      fetchAccidents(),
    ]);
    setRefreshing(false);
  }, [fetchReports, fetchAccidents]);

  // Show ALL citizen concerns (pending, acknowledged, resolved) on the map
  // Previously filtered only verified - now showing all for visibility
  const allConcerns = useMemo(() => {
    console.log('[MapScreen] Total reports from feed:', reports.length);
    return reports;
  }, [reports]);

  // Combine both sources: all citizen concerns + CCTV accidents
  const allIncidents = useMemo(() => {
    return [...allConcerns, ...cctvAccidents];
  }, [allConcerns, cctvAccidents]);

  // Convert to markers (only valid coordinates)
  const incidentMarkers = useMemo(() => {
    return allIncidents
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
        source: r.source,
        images: r.images, // Include images for verified incidents
      }));
  }, [allIncidents]);

  // Process markers with jitter for overlapping coordinates
  const displayedMarkers = useMemo(
    () => processMarkersWithJitter(incidentMarkers),
    [incidentMarkers]
  );

  // Loading state for fetching accident details
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleMarkerPress = async (marker: typeof displayedMarkers[0]) => {
    const color = getMarkerColor(marker.type as EmergencyReport['type'], marker.severity as EmergencyReport['severity']);

    // Check if this is a CCTV accident (id starts with 'accident-')
    const isCctvAccident = marker.id.startsWith('accident-');

    if (isCctvAccident && accessToken) {
      // Fetch full details from backend for CCTV accidents
      const accidentId = parseInt(marker.id.replace('accident-', ''), 10);

      // Show loading state with basic info first
      setSelectedMarker({
        id: marker.id,
        title: marker.title || 'Loading...',
        description: 'Fetching details...',
        type: marker.type || 'unknown',
        severity: marker.severity || 'low',
        location: marker.location || 'Unknown location',
        timestamp: marker.timestamp,
        color,
      });

      setLoadingDetails(true);
      try {
        const details = await fetchActiveAccidentDetail(accidentId, accessToken);
        if (details) {
          // Build location string from details
          let locationStr = marker.location || 'Unknown location';
          if (details.location) {
            const parts = [
              details.location.location_name,
              details.location.barangay,
              details.location.landmark,
            ].filter(Boolean);
            if (parts.length > 0) {
              locationStr = parts.join(', ');
            }
          }

          // Extract images from details (same logic as citizen concerns)
          // Images shown only if verified (handled by InfoCard privacy logic)
          let images: string[] | undefined;
          if (details.media && Array.isArray(details.media)) {
            images = details.media.map(m => m.url).filter(Boolean);
          } else if (details.images && Array.isArray(details.images)) {
            images = details.images.filter(Boolean);
          }

          setSelectedMarker({
            id: marker.id,
            title: details.title || marker.title || 'CCTV Incident',
            description: details.description || 'CCTV detected incident',
            type: marker.type || 'accident',
            severity: marker.severity || 'medium',
            location: locationStr,
            timestamp: marker.timestamp,
            color,
            status: 'acknowledged', // CCTV accidents are acknowledged by default
            images: images && images.length > 0 ? images : undefined, // Same privacy logic as citizen concerns
          });
        }
      } catch (error) {
        console.error('[MapScreen] Error fetching accident details:', error);
      } finally {
        setLoadingDetails(false);
      }
    } else {
      // For citizen concerns, use the existing data (includes images if verified)
      setSelectedMarker({
        id: marker.id,
        title: marker.title || 'Incident Report',
        description: marker.description || 'No description available',
        type: marker.type || 'unknown',
        severity: marker.severity || 'low',
        location: marker.location || 'Unknown location',
        timestamp: marker.timestamp,
        color,
        status: marker.status, // Include status for privacy logic
        images: marker.images, // Include images for verified incidents
      });
    }
  };

  const loading = loadingConcerns || loadingAccidents;
  const citizenCount = allConcerns.length;
  const cctvCount = cctvAccidents.length;

  // Helper function to zoom to coordinates
  const zoomToCoordinates = useCallback((coordinates: { latitude: number; longitude: number }[]) => {
    if (coordinates.length === 0 || !mapRef.current) {
      return;
    }

    // If only one point, zoom to it with a reasonable radius
    if (coordinates.length === 1) {
      mapRef.current.animateToRegion({
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.01, // Zoom level
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      // Fit all points in view
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 100,
          left: 50,
        },
        animated: true,
      });
    }
  }, []);

  // Zoom to citizen concerns when badge is clicked
  const handleCitizenBadgePress = useCallback(() => {
    const coordinates = allConcerns
      .filter((r) => {
        const { latitude: lat, longitude: lng } = r.coordinates ?? {};
        return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
      })
      .map((r) => ({
        latitude: r.coordinates!.latitude,
        longitude: r.coordinates!.longitude,
      }));

    zoomToCoordinates(coordinates);
  }, [allConcerns, zoomToCoordinates]);

  // Zoom to CCTV accidents when badge is clicked
  const handleCctvBadgePress = useCallback(() => {
    const coordinates = cctvAccidents
      .filter((r) => {
        const { latitude: lat, longitude: lng } = r.coordinates ?? {};
        return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
      })
      .map((r) => ({
        latitude: r.coordinates!.latitude,
        longitude: r.coordinates!.longitude,
      }));

    zoomToCoordinates(coordinates);
  }, [cctvAccidents, zoomToCoordinates]);

  return (
    <View style={globalStyles.container}>
      {/* Full Screen Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={BARANGAY_176E_REGION}
          mapType="standard"
          showsCompass
          onMapReady={() => setMapReady(true)}
        >
          {/* Purok Territories (Interactive Polygons) */}
          {purokBoundaries.features
            .filter((feature) =>
              feature.geometry.type === 'LineString' &&
              Array.isArray(feature.geometry.coordinates) &&
              feature.geometry.coordinates.length > 0
            )
            .map((feature, index) => {
              const purokName = feature.properties.name || 'Unknown Purok';
              const isSelected = selectedPurok?.name === purokName;
              const isBoundary = purokName.toLowerCase().includes('boundary');

              // Determine colors based on selection state
              const colorConfig = isBoundary
                ? PUROK_COLORS.boundary
                : isSelected
                  ? PUROK_COLORS.selected
                  : PUROK_COLORS.default;

              return (
                <Polygon
                  key={`purok-${index}`}
                  coordinates={(feature.geometry.coordinates as number[][]).map((coord) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                  }))}
                  fillColor={colorConfig.fill}
                  strokeColor={colorConfig.stroke}
                  strokeWidth={colorConfig.strokeWidth}
                  tappable={!isBoundary}
                  onPress={() => {
                    if (!isBoundary) {
                      setSelectedPurok({
                        name: purokName,
                        description: feature.properties.description,
                      });
                    }
                  }}
                />
              );
            })}
          {/* Incident Markers (Citizen Concerns + CCTV Accidents) */}
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

        {/* Info Card - Privacy Safe (NO photos) */}
        {selectedMarker && (
          <InfoCard marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
        )}

        {/* Loading Overlay */}
        {loading && !refreshing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.loadingOverlayText}>Loading incidents...</Text>
          </View>
        )}

        {/* Floating Stats Card */}
        <View style={styles.floatingStatsCard}>
          <TouchableOpacity
            style={styles.floatingStatItem}
            onPress={handleCitizenBadgePress}
            activeOpacity={0.7}
            disabled={citizenCount === 0}
          >
            <View style={[styles.floatingStatIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={14} color="#2563EB" />
            </View>
            <View style={styles.floatingStatContent}>
              <Text style={[styles.floatingStatNumber, { color: '#2563EB' }]}>{citizenCount}</Text>
              <Text style={styles.floatingStatLabel}>Citizen</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.floatingStatDivider} />

          <TouchableOpacity
            style={styles.floatingStatItem}
            onPress={handleCctvBadgePress}
            activeOpacity={0.7}
            disabled={cctvCount === 0}
          >
            <View style={[styles.floatingStatIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="videocam" size={14} color="#D97706" />
            </View>
            <View style={styles.floatingStatContent}>
              <Text style={[styles.floatingStatNumber, { color: '#D97706' }]}>{cctvCount}</Text>
              <Text style={styles.floatingStatLabel}>CCTV</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.floatingStatDivider} />

          <View style={styles.floatingStatItem}>
            <View style={[styles.floatingStatIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
            </View>
            <Text style={styles.floatingVerifiedText}>Verified</Text>
          </View>
        </View>

        {/* Floating Refresh Button */}
        <TouchableOpacity
          style={styles.floatingRefreshButton}
          onPress={handleRefresh}
          disabled={loading || refreshing}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={loading || refreshing ? '#94a3b8' : '#1e3a8a'}
          />
        </TouchableOpacity>

        {/* Purok Info Card */}
        {selectedPurok && (
          <PurokInfoCard
            name={selectedPurok.name}
            description={selectedPurok.description}
            onClose={() => setSelectedPurok(null)}
          />
        )}

        {/* Map Legend */}
        <MapLegend />

      </View>
    </View>
  );
}

/**
 * Map Screen - View of Incidents & Anomalies
 * 
 * Shows THREE types of data on the map with multi-select filter toggles:
 * 1. Citizen Concerns - Markers (blue)
 * 2. CCTV Accidents (In Progress) - Markers (amber)
 * 3. IoT Anomalies - Markers (purple/orange) — ALL anomalies within Brgy 176-E
 * 
 * Filter: All 3 categories start active. Tap to toggle each on/off.
 */

import { InfoCard } from '@/components/map/info-card';
import { PurokInfoCard } from '@/components/map/purok-info-card';
import { BARANGAY_176E_REGION } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import purokBoundaries from '@/constants/geojson.json';
import { globalStyles } from '@/constants/global-styles';
import { mapStyles as styles } from '@/constants/map-screen.styles';
import { PUROK_COLORS } from '@/constants/purok-colors';
import { useAuth } from '@/context/auth-context';
import { useAnomalyFeed } from '@/hooks/use-anomaly-feed';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import { fetchActiveAccidentDetail, fetchActiveAccidentMarkers, markerToEmergencyReport } from '@/services/active-accidents-service';
import { subscribeToAccidentStatusUpdates } from '@/services/realtime-service';
import type { EmergencyReport } from '@/types';
import type { AnomalyLog } from '@/types/anomaly';
import { getMarkerColor, processMarkersWithJitter, type SelectedMarker } from '@/utils/mapHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

const { colors } = DesignSystem;

type MapFilterCategory = 'citizen' | 'cctv' | 'anomaly';

const ANOMALY_COLORS = {
  sound_anomaly: '#7C3AED',
  anti_tampering: '#EA580C',
  default: '#7C3AED',
} as const;

export default function MapScreen() {
  const { accessToken } = useAuth();

  // Filter state — all active by default
  const [activeFilters, setActiveFilters] = useState<Set<MapFilterCategory>>(
    () => new Set(['citizen', 'cctv', 'anomaly'])
  );

  const toggleFilter = useCallback((category: MapFilterCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Citizen concerns from Pusher/API
  const { reports, loading: loadingConcerns, fetchReports } = useReportsFeed();

  // CCTV accidents (ongoing)
  const [cctvAccidents, setCctvAccidents] = useState<EmergencyReport[]>([]);
  const [loadingAccidents, setLoadingAccidents] = useState(false);

  // IoT Anomalies — all anomalies within Brgy 176-E regardless of purok
  const {
    anomalies,
    loading: loadingAnomalies,
    refreshAnomalies,
    fetchAnomalies,
  } = useAnomalyFeed({ perPage: 100 });

  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPurok, setSelectedPurok] = useState<{ name: string; description?: string } | null>(null);

  // Fetch citizen concerns on mount
  useEffect(() => {
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

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchReports('all');
      fetchAccidents();
      fetchAnomalies();
    }, [fetchReports, fetchAccidents, fetchAnomalies])
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
      refreshAnomalies(),
    ]);
    setRefreshing(false);
  }, [fetchReports, fetchAccidents, refreshAnomalies]);

  const allConcerns = useMemo(() => reports, [reports]);

  // Build separate marker arrays for each category
  const citizenMarkers = useMemo(() => {
    if (!activeFilters.has('citizen')) return [];
    return processMarkersWithJitter(
      allConcerns
        .filter((r) => {
          const { latitude: lat, longitude: lng } = r.coordinates ?? {};
          return lat != null && lng != null && !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        })
        .map((r) => ({
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
          source: 'citizen' as const,
          images: r.images,
        }))
    );
  }, [allConcerns, activeFilters]);

  const cctvMarkers = useMemo(() => {
    if (!activeFilters.has('cctv')) return [];
    return processMarkersWithJitter(
      cctvAccidents
        .filter((r) => {
          const { latitude: lat, longitude: lng } = r.coordinates ?? {};
          return lat != null && lng != null && !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        })
        .map((r) => ({
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
          source: 'cctv' as const,
          images: r.images,
        }))
    );
  }, [cctvAccidents, activeFilters]);

  // Convert IoT anomalies to map markers
  const anomalyMarkers = useMemo(() => {
    if (!activeFilters.has('anomaly')) return [];

    const validAnomalies = anomalies
      .map((a: AnomalyLog) => {
        const rawLat = a.latitude ?? a.iot_box?.latitude;
        const rawLng = a.longitude ?? a.iot_box?.longitude;
        const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
        const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

        if (lat == null || lng == null || isNaN(lat) || isNaN(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null;
        }

        const locationParts = [
          typeof a.location === 'object' ? a.location?.location_name : a.location,
          typeof a.location === 'object' ? a.location?.barangay : undefined,
          a.iot_box?.display_location || a.iot_box?.barangay,
        ].filter(Boolean);

        return {
          id: `anomaly-${a.id}`,
          latitude: lat,
          longitude: lng,
          title: a.anomaly_type_label || 'IoT Anomaly',
          description: a.description || `Detected by ${a.iot_box?.device_name || a.iot_box?.name || 'IoT Box'}`,
          type: a.anomaly_type,
          severity: 'medium' as const,
          location: locationParts.join(', ') || 'Unknown location',
          timestamp: new Date(a.created_at),
          status: a.is_confirmed ? 'confirmed' : 'pending',
          source: 'anomaly' as const,
          images: a.image_url ? [a.image_url] : a.image ? [a.image] : undefined,
          anomalyType: a.anomaly_type,
          isConfirmed: a.is_confirmed,
          iotBoxName: a.iot_box?.device_name || a.iot_box?.name || a.iot_box?.location_name,
        };
      })
      .filter(Boolean) as Array<{
        id: string; latitude: number; longitude: number; title: string;
        description: string; type: string; severity: string; location: string;
        timestamp: Date; status: string; source: 'anomaly'; images?: string[];
        anomalyType: string; isConfirmed: boolean; iotBoxName?: string;
      }>;

    return processMarkersWithJitter(validAnomalies);
  }, [anomalies, activeFilters]);

  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleMarkerPress = async (marker: { id: string; title?: string; description?: string; type?: string; severity?: string; location?: string; timestamp?: Date; status?: string; source?: string; images?: string[]; anomalyType?: string; isConfirmed?: boolean; iotBoxName?: string }) => {
    // Anomaly marker
    if (marker.id.startsWith('anomaly-')) {
      const color = ANOMALY_COLORS[marker.anomalyType as keyof typeof ANOMALY_COLORS] || ANOMALY_COLORS.default;
      setSelectedMarker({
        id: marker.id,
        title: marker.title || 'IoT Anomaly',
        description: marker.description || 'IoT detected anomaly',
        type: marker.anomalyType || 'anomaly',
        severity: marker.isConfirmed ? 'confirmed' : 'pending',
        location: marker.location || 'Unknown location',
        timestamp: marker.timestamp,
        color,
        status: marker.isConfirmed ? 'acknowledged' : 'pending',
        images: marker.images,
      });
      return;
    }

    const color = getMarkerColor(marker.type as EmergencyReport['type'], marker.severity as EmergencyReport['severity']);

    // CCTV accident
    if (marker.id.startsWith('accident-') && accessToken) {
      const accidentId = parseInt(marker.id.replace('accident-', ''), 10);

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
          let locationStr = marker.location || 'Unknown location';
          if (details.location) {
            const parts = [
              details.location.location_name,
              details.location.barangay,
              details.location.landmark,
            ].filter(Boolean);
            if (parts.length > 0) locationStr = parts.join(', ');
          }

          let images: string[] | undefined;
          if (details.media && Array.isArray(details.media)) {
            images = details.media.map((m: any) => m.url).filter(Boolean);
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
            status: 'acknowledged',
            images: images && images.length > 0 ? images : undefined,
          });
        }
      } catch (error) {
        console.error('[MapScreen] Error fetching accident details:', error);
      } finally {
        setLoadingDetails(false);
      }
      return;
    }

    // Citizen concern
    setSelectedMarker({
      id: marker.id,
      title: marker.title || 'Incident Report',
      description: marker.description || 'No description available',
      type: marker.type || 'unknown',
      severity: marker.severity || 'low',
      location: marker.location || 'Unknown location',
      timestamp: marker.timestamp,
      color,
      status: marker.status,
      images: marker.images,
    });
  };

  const loading = loadingConcerns || loadingAccidents || loadingAnomalies;
  const citizenCount = allConcerns.length;
  const cctvCount = cctvAccidents.length;
  const anomalyCount = anomalies.length;

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

  const handleCitizenBadgePress = useCallback(() => {
    toggleFilter('citizen');
  }, [toggleFilter]);

  const handleCctvBadgePress = useCallback(() => {
    toggleFilter('cctv');
  }, [toggleFilter]);

  const handleAnomalyBadgePress = useCallback(() => {
    toggleFilter('anomaly');
  }, [toggleFilter]);

  return (
    <View style={globalStyles.container}>
      {/* Full Screen Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={BARANGAY_176E_REGION}
          mapType="satellite"
          showsCompass
          showsBuildings
          showsTraffic={false}
          loadingEnabled
          loadingIndicatorColor={colors.primary.blue}
          onMapReady={() => setMapReady(true)}
          onMapLoaded={() => console.log('[MapScreen] Map tiles loaded successfully')}
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
          {/* Citizen Markers */}
          {mapReady && citizenMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m._lat, longitude: m._lng }}
              pinColor={getMarkerColor(m.type as EmergencyReport['type'], m.severity as EmergencyReport['severity'])}
              title={m.title}
              description={m.location}
              onPress={() => handleMarkerPress(m)}
            />
          ))}
          {/* CCTV Markers */}
          {mapReady && cctvMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m._lat, longitude: m._lng }}
              pinColor={getMarkerColor(m.type as EmergencyReport['type'], m.severity as EmergencyReport['severity'])}
              title={m.title}
              description={m.location}
              onPress={() => handleMarkerPress(m)}
            />
          ))}
          {/* Anomaly Markers */}
          {mapReady && anomalyMarkers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m._lat, longitude: m._lng }}
              pinColor={ANOMALY_COLORS[m.anomalyType as keyof typeof ANOMALY_COLORS] || ANOMALY_COLORS.default}
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

        {/* Floating Filter Bar */}
        <View style={styles.floatingStatsCard}>
          <TouchableOpacity
            style={[styles.floatingStatItem, !activeFilters.has('citizen') && { opacity: 0.4 }]}
            onPress={handleCitizenBadgePress}
            activeOpacity={0.7}
          >
            <View style={[styles.floatingStatIcon, { backgroundColor: activeFilters.has('citizen') ? '#DBEAFE' : '#F1F5F9' }]}>
              <Ionicons name="people" size={14} color={activeFilters.has('citizen') ? '#2563EB' : '#94A3B8'} />
            </View>
            <View style={styles.floatingStatContent}>
              <Text style={[styles.floatingStatNumber, { color: activeFilters.has('citizen') ? '#2563EB' : '#94A3B8' }]}>{citizenCount}</Text>
              <Text style={styles.floatingStatLabel}>Citizen</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.floatingStatDivider} />

          <TouchableOpacity
            style={[styles.floatingStatItem, !activeFilters.has('cctv') && { opacity: 0.4 }]}
            onPress={handleCctvBadgePress}
            activeOpacity={0.7}
          >
            <View style={[styles.floatingStatIcon, { backgroundColor: activeFilters.has('cctv') ? '#FEF3C7' : '#F1F5F9' }]}>
              <Ionicons name="videocam" size={14} color={activeFilters.has('cctv') ? '#D97706' : '#94A3B8'} />
            </View>
            <View style={styles.floatingStatContent}>
              <Text style={[styles.floatingStatNumber, { color: activeFilters.has('cctv') ? '#D97706' : '#94A3B8' }]}>{cctvCount}</Text>
              <Text style={styles.floatingStatLabel}>CCTV</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.floatingStatDivider} />

          <TouchableOpacity
            style={[styles.floatingStatItem, !activeFilters.has('anomaly') && { opacity: 0.4 }]}
            onPress={handleAnomalyBadgePress}
            activeOpacity={0.7}
          >
            <View style={[styles.floatingStatIcon, { backgroundColor: activeFilters.has('anomaly') ? '#EDE9FE' : '#F1F5F9' }]}>
              <Ionicons name="hardware-chip" size={14} color={activeFilters.has('anomaly') ? '#7C3AED' : '#94A3B8'} />
            </View>
            <View style={styles.floatingStatContent}>
              <Text style={[styles.floatingStatNumber, { color: activeFilters.has('anomaly') ? '#7C3AED' : '#94A3B8' }]}>{anomalyCount}</Text>
              <Text style={styles.floatingStatLabel}>Anomaly</Text>
            </View>
          </TouchableOpacity>
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


      </View>
    </View>
  );
}

/**
 * Map Screen - View of Verified/Ongoing Incidents
 * 
 * Shows TWO types of incidents on the map:
 * 1. Citizen Concerns (acknowledged/resolved by Purok)
 * 2. CCTV Accidents (In Progress - acknowledged by Operator)
 * 
 * PRIVACY PROTECTED:
 * - Photos are NOT shown (hidden in info card)
 * - Only verified/acknowledged incidents appear
 * - Purok Leaders (Role 3) don't get media from API
 */

import { InfoCard } from '@/components/map/info-card';
import { BARANGAY_176E_BOUNDARY, BARANGAY_176E_REGION } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { mapStyles as styles } from '@/constants/map-screen.styles';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import { fetchActiveAccidentMarkers, markerToEmergencyReport } from '@/services/active-accidents-service';
import { subscribeToAccidentStatusUpdates } from '@/services/realtime-service';
import type { EmergencyReport } from '@/types';
import { getMarkerColor, processMarkersWithJitter, type SelectedMarker } from '@/utils/mapHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors } = DesignSystem;

export default function MapScreen() {
  // Citizen concerns from Pusher/API
  const { reports, loading: loadingConcerns, fetchReports } = useReportsFeed();
  
  // CCTV accidents (ongoing)
  const [cctvAccidents, setCctvAccidents] = useState<EmergencyReport[]>([]);
  const [loadingAccidents, setLoadingAccidents] = useState(false);
  
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch citizen concerns on mount
  useEffect(() => {
    fetchReports('all');
  }, [fetchReports]);

  // Fetch CCTV accidents on mount
  const fetchAccidents = useCallback(async () => {
    setLoadingAccidents(true);
    try {
      const markers = await fetchActiveAccidentMarkers();
      const converted = markers.map(markerToEmergencyReport);
      setCctvAccidents(converted);
      console.log('[MapScreen] ✅ Loaded', converted.length, 'CCTV accidents');
    } catch (error) {
      console.error('[MapScreen] Error fetching CCTV accidents:', error);
    } finally {
      setLoadingAccidents(false);
    }
  }, []);

  useEffect(() => {
    fetchAccidents();
  }, [fetchAccidents]);

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

  // PRIVACY FILTER: Only show verified/acknowledged citizen concerns
  const verifiedConcerns = useMemo(() => {
    return reports.filter((r: EmergencyReport) => 
      r.status === 'acknowledged' || r.status === 'resolved'
    );
  }, [reports]);

  // Combine both sources: verified citizen concerns + CCTV accidents
  const allIncidents = useMemo(() => {
    return [...verifiedConcerns, ...cctvAccidents];
  }, [verifiedConcerns, cctvAccidents]);

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
      }));
  }, [allIncidents]);

  // Process markers with jitter for overlapping coordinates
  const displayedMarkers = useMemo(
    () => processMarkersWithJitter(incidentMarkers),
    [incidentMarkers]
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

  const loading = loadingConcerns || loadingAccidents;
  const citizenCount = verifiedConcerns.length;
  const cctvCount = cctvAccidents.length;

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Incident Map</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={loading || refreshing ? colors.text.secondary : colors.primary.blue} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Citizen Concerns Badge */}
          <View style={styles.statBadge}>
            <Ionicons name="people" size={14} color="#3B82F6" />
            <Text style={styles.statBadgeText}>{citizenCount} Citizen</Text>
          </View>
          
          {/* CCTV Accidents Badge */}
          <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="videocam" size={14} color="#D97706" />
            <Text style={[styles.statBadgeText, { color: '#D97706' }]}>{cctvCount} CCTV</Text>
          </View>
          
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.verifiedBadgeText}>Verified Only</Text>
          </View>
        </View>
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

          {/* Incident Markers */}
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

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Citizen</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendText}>CCTV</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

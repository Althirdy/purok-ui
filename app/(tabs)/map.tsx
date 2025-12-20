/**
 * Map Screen - View incidents on map (REALTIME)
 * 
 * Uses default Google Maps (same as uw-citizen heatmap.tsx)
 * - Focused on Barangay 176E area only
 * - Uses GeoJSON boundary data from constants/barangay-boundary.ts
 * - REALTIME: Shows reports from useReportsFeed hook (updates automatically)
 * - Custom styled markers with icons (matching uw-citizen design)
 * - tracksViewChanges={false} for Android performance
 * 
 * NOTE: All View overlays (loading, info badge) MUST be outside MapView
 * to avoid Android "addViewAt" errors. Only Marker/Polygon/etc inside MapView.
 */

import { BARANGAY_176E_BOUNDARY, BARANGAY_176E_REGION, isPointInBoundary } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Fonts } from '@/constants/theme';
import { useReportsFeed } from '@/hooks/use-reports-feed';
import type { EmergencyReport } from '@/types';
import { getSeverityColor } from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

// Get marker icon based on report type
const getMarkerIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'fire':
      return 'flame';
    case 'medical':
      return 'medical';
    case 'crime':
      return 'shield';
    case 'accident':
      return 'car';
    case 'suspicious':
      return 'warning';
    default:
      return 'location';
  }
};

export default function MapScreen() {
  // Get real-time reports from feed hook
  const { reports, loading: reportsLoading, fetchReports } = useReportsFeed();
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const [showOnlyInBoundary, setShowOnlyInBoundary] = React.useState(false); // Toggle for filtering

  // Fetch reports on mount (same as news-feed.tsx)
  useEffect(() => {
    fetchReports('all');
  }, [fetchReports]);

  // Convert reports to markers (only those with coordinates)
  const reportMarkers = useMemo(() => {
    const markersWithCoords = reports
      .filter((report: EmergencyReport) => {
        // Only include reports with valid coordinates
        const lat = report.coordinates?.latitude;
        const lng = report.coordinates?.longitude;
        return (
          lat != null && 
          lng != null && 
          !isNaN(lat) && 
          !isNaN(lng) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180
        );
      })
      .map((report: EmergencyReport) => ({
        id: report.id,
        latitude: report.coordinates!.latitude,
        longitude: report.coordinates!.longitude,
        title: report.title,
        description: report.description,
        type: report.type,
        severity: report.severity,
        status: report.status,
        location: report.location,
        timestamp: report.timestamp,
        report: report, // Keep full report for callout
      }));
    
    // Debug logging
    console.log('[Map] Total reports:', reports.length);
    console.log('[Map] Reports with coordinates:', markersWithCoords.length);
    if (reports.length > 0 && markersWithCoords.length === 0) {
      console.log('[Map] Sample report (no coords):', {
        id: reports[0].id,
        title: reports[0].title,
        coordinates: reports[0].coordinates,
      });
    }
    
    return markersWithCoords;
  }, [reports]);

  // Filter markers to only show those inside Barangay 176E boundary (optional)
  const markersInBoundary = useMemo(() => {
    return reportMarkers.filter((marker) =>
      isPointInBoundary({ latitude: marker.latitude, longitude: marker.longitude })
    );
  }, [reportMarkers]);

  // Show all markers OR only those in boundary based on toggle
  const filteredMarkers = showOnlyInBoundary ? markersInBoundary : reportMarkers;

  // Jitter markers that overlap (same/near coordinates) so bubbles don't stack
  // Memoized to prevent unnecessary recalculations
  const displayedMarkers = useMemo(() => {
    if (!filteredMarkers.length) return [];
    
    // Group by rounded coordinate (~7 decimals ≈ ~1cm; we'll use 5 ≈ ~1m)
    const keyFor = (lat: number, lng: number) => `${lat.toFixed(5)}:${lng.toFixed(5)}`;
    const groups = new Map<string, typeof filteredMarkers>();
    for (const m of filteredMarkers) {
      const k = keyFor(m.latitude, m.longitude);
      const arr = groups.get(k) || [];
      arr.push(m);
      groups.set(k, arr);
    }

    const result: (typeof filteredMarkers[0] & { _lat: number; _lng: number })[] = [];
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399

    groups.forEach((group) => {
      // Base coordinate
      const baseLat = group[0].latitude;
      const baseLng = group[0].longitude;
      const cosLat = Math.cos((baseLat * Math.PI) / 180);
      const metersPerDegLat = 111_320; // approx
      const metersPerDegLng = 111_320 * cosLat; // approx

      group.forEach((m, idx) => {
        if (group.length === 1) {
          result.push({ ...m, _lat: baseLat, _lng: baseLng });
          return;
        }
        // Spiral offset: radius grows slowly with idx; 4m step
        const radiusMeters = 4 * Math.sqrt(idx); // 0, 4, 5.6, 6.9, ...
        const angle = idx * GOLDEN_ANGLE;
        const dx = (radiusMeters * Math.cos(angle)) / metersPerDegLng; // degrees lon
        const dy = (radiusMeters * Math.sin(angle)) / metersPerDegLat; // degrees lat
        result.push({ ...m, _lat: baseLat + dy, _lng: baseLng + dx });
      });
    });

    return result;
  }, [JSON.stringify(filteredMarkers.map(m => m.id))]);

  // Get marker color based on report type and severity
  const getMarkerColor = (marker: { type: EmergencyReport['type']; severity: EmergencyReport['severity'] }): string => {
    // Use severity color as base, but adjust by type for better visual distinction
    const severityColor = getSeverityColor(marker.severity);
    
    // Type-specific color adjustments
    switch (marker.type) {
      case 'fire':
        return marker.severity === 'critical' ? '#DC2626' : marker.severity === 'high' ? '#EF4444' : '#F59E0B';
      case 'medical':
        return marker.severity === 'critical' ? '#DC2626' : marker.severity === 'high' ? '#EF4444' : '#3B82F6';
      case 'crime':
        return marker.severity === 'critical' ? '#991B1B' : marker.severity === 'high' ? '#DC2626' : '#7C2D12';
      case 'accident':
        return marker.severity === 'critical' ? '#DC2626' : marker.severity === 'high' ? '#F59E0B' : '#FBBF24';
      case 'suspicious':
        return marker.severity === 'critical' ? '#7C3AED' : marker.severity === 'high' ? '#8B5CF6' : '#A78BFA';
      default:
        return severityColor;
    }
  };

  // NOTE: getMarkerIcon removed - using default pinColor markers for Android stability

  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(BARANGAY_176E_REGION, 1000);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state if reports are still loading
  const isLoadingData = reportsLoading;

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

      {/* Map View */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ ...StyleSheet.absoluteFillObject }}
          initialRegion={BARANGAY_176E_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          onMapReady={() => {
            setMapReady(true);
          }}
        >

          {/* Barangay 176E Boundary - from constants (fills + stroke) */}
          <Polygon
            coordinates={BARANGAY_176E_BOUNDARY.coordinates}
            fillColor={BARANGAY_176E_BOUNDARY.fillColor}
            strokeColor={BARANGAY_176E_BOUNDARY.strokeColor}
            strokeWidth={BARANGAY_176E_BOUNDARY.strokeWidth}
          />

          {/* Filtered Markers - Only inside boundary */}
          {/* Only render markers when map is ready to prevent Android view hierarchy issues */}
          {mapReady &&
            displayedMarkers.map((marker) => {
              const lat = marker._lat ?? marker.latitude;
              const lng = marker._lng ?? marker.longitude;

              // Skip invalid coordinates
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                return null;
              }

              const markerColor = getMarkerColor({ type: marker.type, severity: marker.severity });
              const isCritical = marker.severity === 'critical' || marker.severity === 'high';

              return (
                <Marker
                  key={marker.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                >
                  {/* Custom Marker Badge - Same as uw-citizen */}
                  <View style={styles.markerContainer}>
                    <View 
                      style={[
                        styles.markerBadge, 
                        { backgroundColor: markerColor }
                      ]}
                    >
                      <Ionicons 
                        name={getMarkerIcon(marker.type)} 
                        size={18} 
                        color="white" 
                      />
                      {isCritical && (
                        <View style={styles.alertDot} />
                      )}
                    </View>
                    <View 
                      style={[
                        styles.markerArrow, 
                        { borderTopColor: markerColor }
                      ]} 
                    />
                  </View>

                  {/* Custom Callout - Info popup when marker is tapped */}
                  <Callout
                    tooltip
                    onPress={() => {
                      requestAnimationFrame(() => {
                        router.push({
                          pathname: 'report-details',
                          params: { reportId: marker.id },
                        } as any);
                      });
                    }}
                  >
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{marker.title}</Text>
                      <Text style={styles.calloutDescription} numberOfLines={2}>
                        {marker.description}
                      </Text>
                      <View style={styles.calloutFooter}>
                        <Text style={styles.calloutType}>
                          {marker.type.toUpperCase()}
                        </Text>
                        <Text 
                          style={[
                            styles.calloutSeverity,
                            { color: markerColor }
                          ]}
                        >
                          {marker.severity.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.calloutTapHint}>Tap to view details</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
        </MapView>

        {/* Show count badge if reports are loading - OUTSIDE MapView to avoid Android issues */}
        {isLoadingData && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.loadingOverlayText}>Updating reports...</Text>
          </View>
        )}

        {/* Boundary Info Badge - Bottom positioned */}
        <View style={styles.boundaryInfoContainer}>
          <View style={styles.boundaryInfoRow}>
            <View style={styles.boundaryInfoBadge}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.boundaryInfoText}>Brgy 176 E</Text>
            </View>
            <Text style={styles.boundaryInfoCount}>
              {filteredMarkers.length} {filteredMarkers.length === 1 ? 'report' : 'reports'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontFamily: Fonts.rounded,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  headerActions: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  
  // Custom Marker Styles (same as uw-citizen)
  markerContainer: {
    alignItems: 'center',
  },
  markerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FBBF24',
    borderWidth: 2,
    borderColor: 'white',
  },

  // Custom Callout Styles - with tooltip styling
  calloutContainer: {
    width: 220,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1F2937',
  },
  calloutDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  calloutType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  calloutSeverity: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  calloutTapHint: {
    fontSize: 11,
    color: colors.primary.blue,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Loading overlay for real-time updates
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlayText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  
  // Boundary Info Badge - Bottom positioned, compact design
  boundaryInfoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 58, 138, 0.95)', // Primary blue with slight transparency
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  boundaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boundaryInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boundaryInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  boundaryInfoCount: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

/**
 * Map Screen - View incidents on map with custom markers
 * 
 * Uses OSM-based tiles (CartoDB) - Uses OpenStreetMap data
 * - No API key required
 * - More permissive than direct OSM tiles (no User-Agent header required)
 * - Still uses OpenStreetMap data, just rendered by CartoDB
 * - Proper attribution included
 * - Focused on Barangay 176E area only
 * - Uses GeoJSON boundary data from constants/geojson.json
 * 
 * Note: Direct OSM tiles require User-Agent header which react-native-maps
 * doesn't support. CartoDB uses OSM data but is more permissive.
 * 
 * Attribution: © OpenStreetMap contributors (data source)
 */

import { BARANGAY_176E_BOUNDARY, BARANGAY_176E_REGION, BARANGAY_176E_CENTER, isPointInBoundary } from '@/constants/barangay-boundary';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { MarkerData, markers } from '@/constants/heatmap.data';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Metro bundler supports JSON imports
import GEOJSON from '@/constants/geojson.json';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polygon, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

// Fallback region kept for reference; using BARANGAY_176E_REGION below
const BRGY_176A_REGION = {
  latitude: 14.7804774,
  longitude: 121.0374894,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

export default function MapScreen() {
  const mapRef = React.useRef<MapView | null>(null);
  type HeatMarker = (typeof markers)[number];

  // Convert GeoJSON polygon (lng, lat) to { latitude, longitude } if needed
  const geojsonCoordinates = useMemo(() => {
    try {
      const rings: number[][][] = GEOJSON.features?.[0]?.geometry?.coordinates ?? [];
      const firstRing = rings[0] || [];
      return firstRing.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    } catch {
      return [] as { latitude: number; longitude: number }[];
    }
  }, []);

  // Filter markers to only show those inside Barangay 176E boundary
  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) =>
      isPointInBoundary({ latitude: marker.latitude, longitude: marker.longitude })
    );
  }, []);

  // Jitter markers that overlap (same/near coordinates) so bubbles don't stack
  const displayedMarkers = useMemo(() => {
    // Group by rounded coordinate (~7 decimals ≈ ~1cm; we'll use 5 ≈ ~1m)
    const keyFor = (lat: number, lng: number) => `${lat.toFixed(5)}:${lng.toFixed(5)}`;
    const groups = new Map<string, MarkerData[]>();
    for (const m of filteredMarkers) {
      const k = keyFor(m.latitude, m.longitude);
      const arr = groups.get(k) || [];
      arr.push(m);
      groups.set(k, arr);
    }

    const result: (MarkerData & { _lat: number; _lng: number })[] = [];
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.399

    groups.forEach((group, _key) => {
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
  }, [filteredMarkers]);

  const getMarkerColor = (marker: HeatMarker): string => {
    switch ((marker as any).type) {
      case 'waste':
        return marker.severity === 'high' ? '#DC2626' : marker.severity === 'medium' ? '#F59E0B' : '#10B981';
      case 'garbage':
        return marker.severity === 'high' ? '#B91C1C' : marker.severity === 'medium' ? '#DC2626' : '#EF4444';
      case 'hazardous':
        return marker.severity === 'high' ? '#7C3AED' : '#8B5CF6';
      case 'recycling':
        return marker.severity === 'high' ? '#059669' : '#10B981';
      case 'littering':
        return marker.severity === 'high' ? '#D97706' : marker.severity === 'medium' ? '#F59E0B' : '#FDE047';
      default:
        return '#6B7280';
    }
  };

  const getMarkerIcon = (marker: HeatMarker): keyof typeof Ionicons.glyphMap => {
    switch ((marker as any).type) {
      case 'waste':
        return 'trash-bin';
      case 'garbage':
        return 'trash';
      case 'hazardous':
        return 'warning';
      case 'recycling':
        return 'leaf';
      case 'littering':
        return 'sad';
      default:
        return 'location';
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(BARANGAY_176E_REGION, 1000);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
        {/* OSM Attribution - Required by OpenStreetMap */}
        <View style={styles.attributionContainer}>
          <Text style={styles.attributionText}>
            © OpenStreetMap contributors
          </Text>
        </View>
        <MapView
          ref={mapRef}
          style={{ ...StyleSheet.absoluteFillObject }}
          initialRegion={BARANGAY_176E_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          // Focus on Barangay 176E - reasonable zoom levels for local area
          minZoomLevel={14}
          maxZoomLevel={18}
          // Use custom OSM tiles instead of Google Maps
          mapType="none"
        >
          {/* CartoDB Positron - Uses OSM data, more permissive than direct OSM tiles */}
          {/* This uses OpenStreetMap data but rendered by CartoDB (no User-Agent required) */}
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            maximumZ={19}
            minimumZ={10}
            tileSize={256}
            shouldReplaceMapContent={true}
          />
          
          {/* Alternative OSM-based providers (uncomment if CartoDB doesn't work): */}
          
          {/* Option 1: Stamen Toner (OSM data, black & white style) */}
          {/* <UrlTile
            urlTemplate="https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png"
            maximumZ={18}
            minimumZ={0}
            tileSize={256}
            shouldReplaceMapContent={true}
          /> */}
          
          {/* Option 2: Stamen Terrain (OSM data, terrain style) */}
          {/* <UrlTile
            urlTemplate="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png"
            maximumZ={18}
            minimumZ={0}
            tileSize={256}
            shouldReplaceMapContent={true}
          /> */}

          {/* Barangay 176E Boundary - from constants (fills + stroke) */}
          <Polygon
            coordinates={BARANGAY_176E_BOUNDARY.coordinates}
            fillColor={BARANGAY_176E_BOUNDARY.fillColor}
            strokeColor={BARANGAY_176E_BOUNDARY.strokeColor}
            strokeWidth={BARANGAY_176E_BOUNDARY.strokeWidth}
          />

          {/* GeoJSON overlay (same area) - using the geojson.json data */}
          {geojsonCoordinates.length > 0 && (
            <Polygon
              coordinates={geojsonCoordinates}
              fillColor="transparent"
              strokeColor="rgba(30,58,138,0.4)"
              strokeWidth={1}
            />
          )}
          {displayedMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: (marker as any)._lat ?? marker.latitude,
                longitude: (marker as any)._lng ?? marker.longitude,
              }}
            >
              {/* Custom Marker with Badge */}
              <View style={styles.markerContainer}>
                <View 
                  style={[
                    styles.markerBadge, 
                    { backgroundColor: getMarkerColor(marker) }
                  ]}
                >
                  <Ionicons 
                    name={getMarkerIcon(marker)} 
                    size={18} 
                    color="white" 
                  />
                  {marker.severity === 'high' && (
                    <View style={styles.alertDot} />
                  )}
                </View>
                <View 
                  style={[
                    styles.markerArrow, 
                    { borderTopColor: getMarkerColor(marker) }
                  ]} 
                />
              </View>

              {/* Custom Callout (info popup when marker is tapped) */}
              <Callout
                onPress={() =>
                  router.push({
                    pathname: 'report-details',
                    params: { reportId: marker.id },
                  } as any)
                }
              >
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{marker.title}</Text>
                  <Text style={styles.calloutDescription}>{marker.description}</Text>
                  <View style={styles.calloutFooter}>
                    <Text style={styles.calloutType}>
                      {marker.type.toUpperCase()}
                    </Text>
                    <Text 
                      style={[
                        styles.calloutSeverity,
                        { color: getMarkerColor(marker) }
                      ]}
                    >
                      {marker.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
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
    ...shadows.sm,
  },
  
  // Custom Marker Styles
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
  
  // Custom Callout Styles
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
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
  
  // OSM Attribution - Required (data source is OpenStreetMap)
  attributionContainer: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
    ...shadows.sm,
  },
  attributionText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
});

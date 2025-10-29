/**
 * Map Screen - View incidents on map with custom markers
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { MarkerData, markers } from '@/constants/heatmap.data';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

const BRGY_176A_REGION = {
  latitude: 14.7804774,
  longitude: 121.0374894,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

export default function MapScreen() {
  const mapRef = React.useRef<MapView | null>(null);

  const getMarkerColor = (marker: MarkerData): string => {
    switch (marker.type) {
      case 'crime':
        return marker.severity === 'high' ? '#DC2626' : '#EF4444';
      case 'emergency':
        return marker.severity === 'high' ? '#B91C1C' : '#DC2626';
      case 'safety':
        return marker.severity === 'high' ? '#D97706' : '#F59E0B';
      case 'incident':
        return marker.severity === 'high' ? '#7C3AED' : '#8B5CF6';
      case 'report':
        return marker.severity === 'high' ? '#059669' : '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getMarkerIcon = (marker: MarkerData): keyof typeof Ionicons.glyphMap => {
    switch (marker.type) {
      case 'crime':
        return 'warning';
      case 'emergency':
        return 'alert-circle';
      case 'safety':
        return 'shield-checkmark';
      case 'incident':
        return 'information-circle';
      case 'report':
        return 'flag';
      default:
        return 'location';
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(BRGY_176A_REGION, 1000);
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
        <MapView
          ref={mapRef}
          style={{ ...StyleSheet.absoluteFillObject }}
          initialRegion={BRGY_176A_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
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
              <Callout>
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
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
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
});

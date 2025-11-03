/**
 * Barangay 176E Boundary Coordinates
 * North Caloocan, Metropolitan Manila
 *
 * Coordinates traced from official Caloocan City cadastral boundary map
 * Testing area for citizen concern reporting system
 */

export interface BoundaryCoordinate {
  latitude: number;
  longitude: number;
}

export interface BarangayBoundary {
  name: string;
  code: string;
  coordinates: BoundaryCoordinate[];
  center: BoundaryCoordinate;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// Barangay 176E boundary coordinates (accurately plotted from cadastral map using geojson.io)
// Coordinates form a closed polygon representing the testing area
export const BARANGAY_176E_COORDINATES: BoundaryCoordinate[] = [
  { latitude: 14.784497400912883, longitude: 121.0341794182691 },
  { latitude: 14.783595582640359, longitude: 121.03393458566063 },
  { latitude: 14.782862852535175, longitude: 121.03388795087824 },
  { latitude: 14.781341020570238, longitude: 121.03438927479095 },
  { latitude: 14.780822467982475, longitude: 121.03436595739976 },
  { latitude: 14.779920634446412, longitude: 121.03448254435557 },
  { latitude: 14.777179790286354, longitude: 121.0345965517069 },
  { latitude: 14.776329421475538, longitude: 121.03861427279833 },
  { latitude: 14.778799957440398, longitude: 121.03994734154685 },
  { latitude: 14.778251613221727, longitude: 121.04099643493117 },
  { latitude: 14.777383346157407, longitude: 121.0421721275074 },
  { latitude: 14.777096906776862, longitude: 121.04302381031835 },
  { latitude: 14.776846272008825, longitude: 121.04502341344107 },
  { latitude: 14.778708123378124, longitude: 121.04528262125461 },
  { latitude: 14.782236814924687, longitude: 121.04811881571356 },
  { latitude: 14.783494424959827, longitude: 121.0478160216627 },
  { latitude: 14.784128180304322, longitude: 121.04797987677722 },
  { latitude: 14.784722322777512, longitude: 121.04827687853867 },
  { latitude: 14.784910467554297, longitude: 121.0481847055774 },
  { latitude: 14.785296658954849, longitude: 121.04771359933568 },
  { latitude: 14.78613835578166, longitude: 121.04737563181413 },
  { latitude: 14.786663176855939, longitude: 121.04735514893412 },
  { latitude: 14.78686122221535, longitude: 121.04721176877399 },
  { latitude: 14.786455229035411, longitude: 121.04661776525097 },
  { latitude: 14.785544217184011, longitude: 121.04531710236472 },
  { latitude: 14.785039198098275, longitude: 121.04448754572144 },
  { latitude: 14.785108514512771, longitude: 121.0439959565997 },
  { latitude: 14.78566304503434, longitude: 121.0436579890781 },
  { latitude: 14.786455229035411, longitude: 121.04394474939966 },
  { latitude: 14.787168192164657, longitude: 121.04326881435657 },
  { latitude: 14.786465131317044, longitude: 121.04266456939342 },
  { latitude: 14.785908319169778, longitude: 121.04224466934596 },
  { latitude: 14.78579939376695, longitude: 121.04156873430412 },
  { latitude: 14.78428433476492, longitude: 121.04112835238118 },
  { latitude: 14.783888239164753, longitude: 121.04063676325944 },
  { latitude: 14.784413064873846, longitude: 121.03968431129067 },
  { latitude: 14.785264667463053, longitude: 121.03816857816298 },
  { latitude: 14.785116132367705, longitude: 121.03758481608122 },
  { latitude: 14.785126034710487, longitude: 121.0365606720764 },
  { latitude: 14.78483886936094, longitude: 121.03631487756013 },
  { latitude: 14.783858533934804, longitude: 121.03627391180004 },
  { latitude: 14.783640681017502, longitude: 121.0359973929186 },
  { latitude: 14.783650583427587, longitude: 121.03522928491537 },
  { latitude: 14.783967460312653, longitude: 121.03476842011366 },
  { latitude: 14.784442774772458, longitude: 121.03461479851228 },
  { latitude: 14.784497400912883, longitude: 121.0341794182691 },
];

// Calculated center point for map focusing (centroid of the polygon)
export const BARANGAY_176E_CENTER: BoundaryCoordinate = {
  latitude: 14.782013456,
  longitude: 121.041245789,
};

// Complete boundary configuration
export const BARANGAY_176E_BOUNDARY: BarangayBoundary = {
  name: 'Barangay 176 E',
  code: '176E',
  coordinates: BARANGAY_176E_COORDINATES,
  center: BARANGAY_176E_CENTER,
  fillColor: 'rgba(34, 197, 94, 0.15)',
  strokeColor: '#1e3a8a',
  strokeWidth: 3,
};

// Helper function to check if a point is inside the boundary polygon
export function isPointInBoundary(
  point: BoundaryCoordinate,
  boundary: BoundaryCoordinate[] = BARANGAY_176E_COORDINATES
): boolean {
  let inside = false;
  const x = point.latitude;
  const y = point.longitude;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const xi = boundary[i].latitude;
    const yi = boundary[i].longitude;
    const xj = boundary[j].latitude;
    const yj = boundary[j].longitude;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Map region configuration for optimal boundary viewing
export const BARANGAY_176E_REGION = {
  latitude: BARANGAY_176E_CENTER.latitude,
  longitude: BARANGAY_176E_CENTER.longitude,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};



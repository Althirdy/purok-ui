export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'safety' | 'crime' | 'incident' | 'emergency' | 'report';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Markers scattered around BRGY_176A_REGION (14.7804774, 121.0374894)
// Using ~0.008 degree radius (approximately 800-900 meters)
export const markers: MarkerData[] = [
  {
    id: '1',
    latitude: 14.7810220,
    longitude: 121.0380450,
    title: 'Street Light Outage',
    description: 'Broken street light on main road',
    type: 'safety',
    severity: 'medium',
    timestamp: '2024-09-27T08:30:00Z'
  },
  {
    id: '2',
    latitude: 14.7798340,
    longitude: 121.0368920,
    title: 'Theft Report',
    description: 'Motorcycle theft reported in this area',
    type: 'crime',
    severity: 'high',
    timestamp: '2024-09-26T22:15:00Z'
  },
  {
    id: '3',
    latitude: 14.7812560,
    longitude: 121.0372140,
    title: 'Pothole',
    description: 'Large pothole causing traffic issues',
    type: 'incident',
    severity: 'medium',
    timestamp: '2024-09-27T14:20:00Z'
  },
  {
    id: '4',
    latitude: 14.7800120,
    longitude: 121.0382670,
    title: 'Suspicious Activity',
    description: 'Suspicious individuals loitering near school',
    type: 'safety',
    severity: 'medium',
    timestamp: '2024-09-27T16:45:00Z'
  },
  {
    id: '5',
    latitude: 14.7796850,
    longitude: 121.0376540,
    title: 'Fire Hazard',
    description: 'Exposed electrical wires near residential area',
    type: 'emergency',
    severity: 'high',
    timestamp: '2024-09-27T10:10:00Z'
  },
  {
    id: '6',
    latitude: 14.7808930,
    longitude: 121.0368200,
    title: 'Drug Activity',
    description: 'Suspected drug dealing in alley',
    type: 'crime',
    severity: 'high',
    timestamp: '2024-09-26T20:30:00Z'
  },
  {
    id: '7',
    latitude: 14.7799450,
    longitude: 121.0379320,
    title: 'Noise Complaint',
    description: 'Loud music disturbing residents',
    type: 'incident',
    severity: 'low',
    timestamp: '2024-09-27T23:00:00Z'
  },
  {
    id: '8',
    latitude: 14.7806120,
    longitude: 121.0377890,
    title: 'Vandalism',
    description: 'Graffiti on public property',
    type: 'crime',
    severity: 'low',
    timestamp: '2024-09-27T07:15:00Z'
  },
  {
    id: '9',
    latitude: 14.7802340,
    longitude: 121.0370560,
    title: 'Poor Lighting',
    description: 'Dark area needs additional lighting',
    type: 'safety',
    severity: 'medium',
    timestamp: '2024-09-27T19:30:00Z'
  },
  {
    id: '10',
    latitude: 14.7811780,
    longitude: 121.0381240,
    title: 'Traffic Accident',
    description: 'Minor collision at intersection',
    type: 'incident',
    severity: 'medium',
    timestamp: '2024-09-27T12:45:00Z'
  },
  {
    id: '11',
    latitude: 14.7797230,
    longitude: 121.0373180,
    title: 'Flooding Risk',
    description: 'Clogged drainage causing water accumulation',
    type: 'emergency',
    severity: 'medium',
    timestamp: '2024-09-27T06:00:00Z'
  },
  {
    id: '12',
    latitude: 14.7809650,
    longitude: 121.0375840,
    title: 'Stray Animals',
    description: 'Pack of stray dogs in residential area',
    type: 'safety',
    severity: 'low',
    timestamp: '2024-09-27T15:20:00Z'
  },
  {
    id: '13',
    latitude: 14.7804890,
    longitude: 121.0369430,
    title: 'Broken Sidewalk',
    description: 'Cracked pavement creating walking hazard',
    type: 'safety',
    severity: 'low',
    timestamp: '2024-09-27T11:00:00Z'
  },
  {
    id: '14',
    latitude: 14.7801560,
    longitude: 121.0381950,
    title: 'Illegal Dumping',
    description: 'Garbage dumped in vacant lot',
    type: 'incident',
    severity: 'medium',
    timestamp: '2024-09-26T18:30:00Z'
  },
  {
    id: '15',
    latitude: 14.7807420,
    longitude: 121.0373670,
    title: 'Missing Manhole Cover',
    description: 'Open manhole poses danger to pedestrians',
    type: 'emergency',
    severity: 'high',
    timestamp: '2024-09-27T09:45:00Z'
  }
];


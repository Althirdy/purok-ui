export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'waste' | 'garbage' | 'recycling' | 'hazardous' | 'littering';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// Markers scattered within Barangay 176E boundary
// All coordinates are within the actual cadastral boundary polygon
export const markers: MarkerData[] = [
  {
    id: '1',
    latitude: 14.78345,
    longitude: 121.04215,
    title: 'Overflowing Trash Bins',
    description: 'Multiple garbage bins overflowing on the street',
    type: 'waste',
    severity: 'high',
    timestamp: '2024-09-27T08:30:00Z'
  },
  {
    id: '2',
    latitude: 14.78182,
    longitude: 121.03985,
    title: 'Illegal Dumping Site',
    description: 'Large pile of household waste dumped in vacant lot',
    type: 'garbage',
    severity: 'high',
    timestamp: '2024-09-26T22:15:00Z'
  },
  {
    id: '3',
    latitude: 14.78512,
    longitude: 121.04485,
    title: 'Plastic Waste Accumulation',
    description: 'Pile of plastic bottles and bags near drainage',
    type: 'littering',
    severity: 'medium',
    timestamp: '2024-09-27T14:20:00Z'
  },
  {
    id: '4',
    latitude: 14.78035,
    longitude: 121.0412,
    title: 'Recyclable Materials',
    description: 'Cardboard boxes and paper not segregated properly',
    type: 'recycling',
    severity: 'low',
    timestamp: '2024-09-27T16:45:00Z'
  },
  {
    id: '5',
    latitude: 14.78468,
    longitude: 121.03795,
    title: 'Chemical Waste Container',
    description: 'Abandoned paint cans and chemical containers',
    type: 'hazardous',
    severity: 'high',
    timestamp: '2024-09-27T10:10:00Z'
  },
  {
    id: '6',
    latitude: 14.78289,
    longitude: 121.04356,
    title: 'Construction Debris',
    description: 'Concrete rubble and wood scraps left on sidewalk',
    type: 'waste',
    severity: 'medium',
    timestamp: '2024-09-26T20:30:00Z'
  },
  {
    id: '7',
    latitude: 14.77985,
    longitude: 121.04012,
    title: 'Food Waste Littering',
    description: 'Decomposing food waste scattered on the road',
    type: 'littering',
    severity: 'medium',
    timestamp: '2024-09-27T23:00:00Z'
  },
  {
    id: '8',
    latitude: 14.78618,
    longitude: 121.04625,
    title: 'Electronic Waste',
    description: 'Old television and appliances dumped',
    type: 'hazardous',
    severity: 'medium',
    timestamp: '2024-09-27T07:15:00Z'
  },
  {
    id: '9',
    latitude: 14.78375,
    longitude: 121.03568,
    title: 'Uncollected Garbage Bags',
    description: 'Garbage bags piling up, missed collection',
    type: 'garbage',
    severity: 'high',
    timestamp: '2024-09-27T19:30:00Z'
  },
  {
    id: '10',
    latitude: 14.78145,
    longitude: 121.04285,
    title: 'Broken Glass Waste',
    description: 'Shattered glass bottles creating hazard',
    type: 'hazardous',
    severity: 'high',
    timestamp: '2024-09-27T12:45:00Z'
  },
  {
    id: '11',
    latitude: 14.77798,
    longitude: 121.03865,
    title: 'Clogged Canal with Waste',
    description: 'Plastic bags and bottles blocking drainage',
    type: 'waste',
    severity: 'high',
    timestamp: '2024-09-27T06:00:00Z'
  },
  {
    id: '12',
    latitude: 14.78585,
    longitude: 121.04312,
    title: 'Paper and Cardboard',
    description: 'Recyclable paper materials scattered around',
    type: 'recycling',
    severity: 'low',
    timestamp: '2024-09-27T15:20:00Z'
  },
  {
    id: '13',
    latitude: 14.78432,
    longitude: 121.04058,
    title: 'Cigarette Butts Accumulation',
    description: 'Large amount of cigarette butts on sidewalk',
    type: 'littering',
    severity: 'low',
    timestamp: '2024-09-27T11:00:00Z'
  },
  {
    id: '14',
    latitude: 14.78265,
    longitude: 121.03725,
    title: 'Furniture Abandonment',
    description: 'Old furniture dumped near residential area',
    type: 'garbage',
    severity: 'medium',
    timestamp: '2024-09-26T18:30:00Z'
  },
  {
    id: '15',
    latitude: 14.78012,
    longitude: 121.04425,
    title: 'Medical Waste',
    description: 'Used syringes and medical supplies improperly disposed',
    type: 'hazardous',
    severity: 'high',
    timestamp: '2024-09-27T09:45:00Z'
  },
  {
    id: '16',
    latitude: 14.78328,
    longitude: 121.04682,
    title: 'Tire Disposal',
    description: 'Multiple old tires dumped in empty lot',
    type: 'waste',
    severity: 'medium',
    timestamp: '2024-09-27T13:20:00Z'
  },
  {
    id: '17',
    latitude: 14.78495,
    longitude: 121.04185,
    title: 'Metal Scraps',
    description: 'Rusty metal parts and wires scattered',
    type: 'recycling',
    severity: 'low',
    timestamp: '2024-09-26T16:00:00Z'
  },
  {
    id: '18',
    latitude: 14.77865,
    longitude: 121.04095,
    title: 'Organic Waste Pile',
    description: 'Rotting vegetables and food waste near market',
    type: 'garbage',
    severity: 'high',
    timestamp: '2024-09-27T17:45:00Z'
  },
  {
    id: '19',
    latitude: 14.78642,
    longitude: 121.04418,
    title: 'Battery Disposal',
    description: 'Used batteries thrown in regular trash',
    type: 'hazardous',
    severity: 'high',
    timestamp: '2024-09-27T08:00:00Z'
  },
  {
    id: '20',
    latitude: 14.78198,
    longitude: 121.03695,
    title: 'Fast Food Littering',
    description: 'Plastic containers and wrappers along the road',
    type: 'littering',
    severity: 'low',
    timestamp: '2024-09-26T14:30:00Z'
  }
];
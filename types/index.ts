/**
 * TypeScript Type Definitions
 */

// User Types
export interface User {
  id: string;
  name: string;
  role: 'purok_leader' | 'official' | 'admin';
  purokId: string;
  purokName: string;
  pin?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profilePicture?: string;
}

// Related Report (follow-up/duplicate merged into parent concern)
export interface RelatedReport {
  id: number;
  description: string;
  citizen_name?: string; // May be encrypted
  created_at: string;
  images?: string[];
}

// Report Types
export interface EmergencyReport {
  id: string;
  type: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  lastUpdated?: Date;
  status: 'pending' | 'acknowledged' | 'resolved' | 'rejected' | 'awaiting_confirmation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy?: string;
  source?: 'cctv' | 'sensor' | 'citizen' | 'official';
  // Optional fields for citizen reports
  images?: string[]; // Array of image URLs
  audio?: string | null; // Audio URL for voice concerns
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Report type classification (manual vs voice)
  reportType?: 'manual' | 'voice'; // 'voice' if has audio or category is 'voice_concern', 'manual' otherwise
  // Original category from citizen side (preserved for display)
  originalCategory?: string; // 'safety', 'security', 'infrastructure', 'environment', 'noise', 'other', 'voice_concern'
  // Voice transcription fields (for voice concerns)
  transcript?: string | null; // Full transcript text from backend (transcript_text / transcript)
  transcriptionStatus?: 'queued' | 'processing' | 'completed' | 'failed'; // Realtime transcription status
  // Related reports (follow-ups/duplicates merged into this concern)
  relatedReportsCount?: number;
  relatedReports?: RelatedReport[];
  // Resolution confirmation timestamps (for awaiting_confirmation flow)
  resolutionRequestedAt?: Date;  // When PL first clicked resolve
  resolutionConfirmedAt?: Date;  // When citizen confirmed (null = not yet confirmed)
}

// Feed Types
export type FeedSource = 'all' | 'cctv' | 'sensor_box' | 'citizen_reports';

export interface FeedFilter {
  source: FeedSource;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: EmergencyReport['status'][];
  severity?: EmergencyReport['severity'][];
}

// Navigation Types
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'report-details': { reportId: string };
  'create-report': undefined;
};

export type TabParamList = {
  'news-feed': undefined;
  'map': undefined;
  'profile': undefined;
};

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  onPress?: () => void;
}

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

// Re-export anomaly types
export * from './anomaly';


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
}

// Report Types
export interface EmergencyReport {
  id: string;
  type: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy?: string;
  source?: 'cctv' | 'sensor' | 'citizen' | 'official';
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


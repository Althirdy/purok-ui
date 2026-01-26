import { PostCategory } from '@/types/posts';
import { Ionicons } from '@expo/vector-icons';

/**
 * Get icon for post category
 */
export const getCategoryIcon = (category: PostCategory): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'General':
      return 'information-circle-outline';
    case 'News':
      return 'newspaper-outline';
    case 'Alert':
      return 'alert-circle-outline';
    case 'Event':
      return 'calendar-outline';
    case 'Maintenance':
      return 'construct-outline';
    default:
      return 'information-circle-outline';
  }
};

/**
 * Get color for post category
 */
export const getCategoryColor = (category: PostCategory): string => {
  switch (category) {
    case 'General':
      return '#6b7280'; // gray
    case 'News':
      return '#3b82f6'; // blue
    case 'Alert':
      return '#ef4444'; // red
    case 'Event':
      return '#8b5cf6'; // purple
    case 'Maintenance':
      return '#f59e0b'; // amber
    default:
      return '#6b7280'; // gray
  }
};

/**
 * Filter Tabs Component for News Feed - Responsive for Mobile
 */

import { DesignSystem } from '@/constants/design-system';
import { isTablet } from '@/constants/responsive';
import type { FeedSource } from '@/types';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

const { colors, typography, spacing, borderRadius } = DesignSystem;

interface FilterTabsProps {
  activeFilter: FeedSource;
  onFilterChange: (filter: FeedSource) => void;
}

const filters: { key: FeedSource; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cctv', label: 'CCTV' },
  { key: 'sensor_box', label: 'Sensor Box' },
  { key: 'citizen_reports', label: 'Citizens' },
];

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.tab,
            activeFilter === filter.key && styles.tabActive,
          ]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === filter.key && styles.tabTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    paddingRight: spacing.md,
  },
  
  container: {
    paddingHorizontal: 0, // Remove padding to prevent cut-off
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    paddingLeft: spacing.lg, // Only left padding
  },
  
  tab: {
    paddingHorizontal: spacing.md * (isTablet ? 1.2 : 1),
    paddingVertical: spacing.sm * (isTablet ? 1.2 : 1),
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.neutral.gray600,
    marginRight: spacing.sm,
  },
  
  tabActive: {
    backgroundColor: colors.primary.blue,
    borderColor: colors.primary.blue,
  },
  
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  
  tabTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
});


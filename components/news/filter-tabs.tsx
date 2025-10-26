/**
 * Filter Tabs Component for News Feed
 */

import { DesignSystem } from '@/constants/design-system';
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.neutral.gray600,
  },
  
  tabActive: {
    backgroundColor: colors.accent.orange,
    borderColor: colors.accent.orange,
  },
  
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});


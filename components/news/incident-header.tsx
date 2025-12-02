import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import type { FeedSource } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { colors, typography, spacing, shadows } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

export interface IncidentHeaderProps {
  activeFilter: FeedSource;
  statusFilter: 'all' | 'pending' | 'ongoing' | 'resolved';
  reportTypeFilter: 'all' | 'manual' | 'voice';
  pendingCount: number;
  resolvedCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  committedQuery: string;
  setCommittedQuery: (value: string) => void;
  onFilterPress: () => void;
  onFeedFilterChange: (filter: FeedSource) => void;
  setStatusFilter: (value: IncidentHeaderProps['statusFilter']) => void;
  setReportTypeFilter: (value: IncidentHeaderProps['reportTypeFilter']) => void;
}

export function IncidentHeader(props: IncidentHeaderProps) {
  const {
    activeFilter,
    statusFilter,
    reportTypeFilter,
    pendingCount,
    resolvedCount,
    searchQuery,
    setSearchQuery,
    committedQuery,
    setCommittedQuery,
    onFilterPress,
    onFeedFilterChange,
    setStatusFilter,
    setReportTypeFilter,
  } = props;

  const { user } = useAuth();

  const displayName = useMemo(() => {
    const name = (user?.name || '').trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
    return name || 'Purok Leader';
  }, [user]);

  return (
    <View style={styles.headerWrapper}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Ionicons name="shield" size={isTablet ? 24 : 18} color={colors.primary.blue} />
            </View>
            <View>
              <Text style={styles.headerTitle}>UrbanWatch</Text>
              <Text style={styles.headerSubtitle}>Purok Feed</Text>
              <Text style={styles.headerWelcome}>Welcome, {displayName}</Text>
            </View>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Utilities: Search + Stats */}
      <View style={styles.utilities}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <TouchableOpacity
              onPress={() => setCommittedQuery(searchQuery.trim())}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchText}
              placeholder="Search concerns..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode={isIOS ? 'while-editing' : 'never'}
              onSubmitEditing={() => setCommittedQuery(searchQuery.trim())}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={onFilterPress}
          >
            <Ionicons name="options-outline" size={18} color={colors.text.inverse} />
            {(statusFilter !== 'all' || reportTypeFilter !== 'all') && (
              <View style={styles.filterButtonDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* Active filter chips */}
        {(statusFilter !== 'all' || reportTypeFilter !== 'all') && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersContainer}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {statusFilter !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Text>
                <TouchableOpacity onPress={() => setStatusFilter('all')}>
                  <Ionicons name="close" size={14} color="#1e3a8a" />
                </TouchableOpacity>
              </View>
            )}
            {reportTypeFilter !== 'all' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Type: {reportTypeFilter.charAt(0).toUpperCase() + reportTypeFilter.slice(1)}
                </Text>
                <TouchableOpacity onPress={() => setReportTypeFilter('all')}>
                  <Ionicons name="close" size={14} color="#1e3a8a" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={styles.statValue}>{resolvedCount}</Text>
          </View>
        </View>
      </View>

      {/* Current Report Section */}
      <View style={styles.currentReportSection}>
        <View style={styles.currentReportHeader}>
          <Text style={styles.currentReportTitle}>Your Concerns ({pendingCount})</Text>
        </View>
      </View>

      {/* Source filter boxes */}
      <View style={styles.filterGrid}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFeedFilterChange('all')}
          style={[styles.filterBox, activeFilter === 'all' && styles.filterBoxActive]}
        >
          <Text style={styles.filterBoxLabel}>All</Text>
          <View style={[styles.filterIconWrap, styles.iconAll]}>
            <Ionicons
              name="apps-outline"
              size={18}
              color={activeFilter === 'all' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFeedFilterChange('cctv')}
          style={[styles.filterBox, activeFilter === 'cctv' && styles.filterBoxActive]}
        >
          <Text style={styles.filterBoxLabel}>CCTV</Text>
          <View style={[styles.filterIconWrap, styles.iconCctv]}>
            <Ionicons
              name="videocam-outline"
              size={18}
              color={activeFilter === 'cctv' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFeedFilterChange('sensor_box')}
          style={[styles.filterBox, activeFilter === 'sensor_box' && styles.filterBoxActive]}
        >
          <Text style={styles.filterBoxLabel}>Sensor Box</Text>
          <View style={[styles.filterIconWrap, styles.iconSensor]}>
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={activeFilter === 'sensor_box' ? colors.primary.blue : colors.neutral.gray700}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFeedFilterChange('citizen_reports')}
          style={[styles.filterBox, activeFilter === 'citizen_reports' && styles.filterBoxActive]}
        >
          <Text style={styles.filterBoxLabel}>Citizen</Text>
          <View style={[styles.filterIconWrap, styles.iconCitizen]}>
            <Ionicons
              name="people-outline"
              size={18}
              color={
                activeFilter === 'citizen_reports' ? colors.primary.blue : colors.neutral.gray700
              }
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -(spacing.lg * (isTablet ? 1.5 : 1)),
  },
  header: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: isTablet ? '70%' : '80%',
  },
  logoSmall: {
    width: isTablet ? 56 : 36,
    height: isTablet ? 56 : 36,
    borderRadius: isTablet ? 28 : 18,
    backgroundColor: colors.neutral.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  headerWelcome: {
    fontSize: isTablet ? typography.fontSize.base : typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.85,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  utilities: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchText: {
    marginLeft: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.error,
  },
  activeFiltersContainer: {
    marginBottom: spacing.sm,
  },
  activeFiltersContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  activeFilterText: {
    fontSize: typography.fontSize.xs,
    color: '#1e3a8a',
    fontWeight: typography.fontWeight.semibold,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 20,
    padding: spacing.md,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  statValue: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: isTablet ? typography.fontSize['2xl'] : typography.fontSize.xl,
    marginTop: 2,
  },
  currentReportSection: {
    marginBottom: spacing.sm,
  },
  currentReportHeader: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  currentReportTitle: {
    fontSize: isTablet ? typography.fontSize.lg : typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  filterGrid: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterBox: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAll: { backgroundColor: '#E6ECF2' },
  iconCctv: { backgroundColor: '#E6F0FF' },
  iconSensor: { backgroundColor: '#EAF7EE' },
  iconCitizen: { backgroundColor: '#F1EAFE' },
  filterBoxLabel: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  filterBoxActive: {
    borderColor: colors.primary.blue,
    backgroundColor: '#EFF6FF',
  },
});



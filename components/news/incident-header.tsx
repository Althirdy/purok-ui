import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
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
  statusFilter: 'all' | 'pending' | 'ongoing' | 'resolved';
  reportTypeFilter: 'all' | 'manual' | 'voice';
  pendingCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
  displayedCount: number; // Count of currently displayed/filtered reports
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  committedQuery: string;
  setCommittedQuery: (value: string) => void;
  onFilterPress: () => void;
  setStatusFilter: (value: IncidentHeaderProps['statusFilter']) => void;
  setReportTypeFilter: (value: IncidentHeaderProps['reportTypeFilter']) => void;
}

export function IncidentHeader(props: IncidentHeaderProps) {
  const {
    statusFilter,
    reportTypeFilter,
    pendingCount,
    acknowledgedCount,
    resolvedCount,
    displayedCount,
    searchQuery,
    setSearchQuery,
    committedQuery,
    setCommittedQuery,
    onFilterPress,
    setStatusFilter,
    setReportTypeFilter,
  } = props;

  const { user } = useAuth();

  const displayName = useMemo(() => {
    const name = (user?.name || '').trim();
    const parts = name.split(/\s+/);
    // Just use first name for a friendlier greeting
    if (parts.length >= 1 && parts[0]) return parts[0];
    return 'Purok Leader';
  }, [user]);

  return (
    <View style={styles.headerWrapper}>
      {/* Utilities: Search + Stats */}
      <View style={styles.utilities}>
        {/* Welcome Card */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <View style={styles.welcomeIconContainer}>
              <Ionicons name="person-circle" size={40} color={colors.primary.blue} />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Welcome back, {displayName}!</Text>
              <Text style={styles.welcomeSubtext}>
                {pendingCount > 0 
                  ? `You have ${pendingCount} pending concern${pendingCount > 1 ? 's' : ''}`
                  : acknowledgedCount > 0
                    ? `${acknowledgedCount} concern${acknowledgedCount > 1 ? 's' : ''} in progress`
                    : 'All concerns are resolved'}
              </Text>
            </View>
          </View>
        </View>

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
            <Text style={styles.statLabel}>Acknowledged</Text>
            <Text style={styles.statValue}>{acknowledgedCount}</Text>
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
          <Text style={styles.currentReportTitle}>Activity Feed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -(spacing.lg * (isTablet ? 1.5 : 1)),
  },
  utilities: {
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  welcomeContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    marginRight: spacing.md,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: isTablet ? typography.fontSize.lg : typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: isTablet ? typography.fontSize.sm : typography.fontSize.xs,
    color: colors.text.secondary,
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
});



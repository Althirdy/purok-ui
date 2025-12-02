import { DesignSystem } from '@/constants/design-system';
import React from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

export interface FilterModalProps {
  visible: boolean;
  statusFilter: 'all' | 'pending' | 'ongoing' | 'resolved';
  reportTypeFilter: 'all' | 'manual' | 'voice';
  totalCount: number;
  pendingCount: number;
  ongoingCount: number;
  resolvedCount: number;
  onStatusFilterChange: (filter: 'all' | 'pending' | 'ongoing' | 'resolved') => void;
  onReportTypeFilterChange: (filter: 'all' | 'manual' | 'voice') => void;
  onClose: () => void;
  onClearAll: () => void;
}

export function FilterModal({
  visible,
  statusFilter,
  reportTypeFilter,
  totalCount,
  pendingCount,
  ongoingCount,
  resolvedCount,
  onStatusFilterChange,
  onReportTypeFilterChange,
  onClose,
  onClearAll,
}: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Filter Concerns</Text>

          {/* Status */}
          <Text style={styles.modalSectionTitle}>Status</Text>
          <View style={styles.chipGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, statusFilter === 'all' && styles.chipActive]}
              onPress={() => onStatusFilterChange('all')}
            >
              <Text
                style={[styles.chipLabel, statusFilter === 'all' && styles.chipLabelActive]}
              >
                All
              </Text>
              <Text
                style={[styles.chipCount, statusFilter === 'all' && styles.chipCountActive]}
              >
                {totalCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, statusFilter === 'pending' && styles.chipActive]}
              onPress={() => onStatusFilterChange('pending')}
            >
              <Text
                style={[styles.chipLabel, statusFilter === 'pending' && styles.chipLabelActive]}
              >
                Pending
              </Text>
              <Text
                style={[styles.chipCount, statusFilter === 'pending' && styles.chipCountActive]}
              >
                {pendingCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, statusFilter === 'ongoing' && styles.chipActive]}
              onPress={() => onStatusFilterChange('ongoing')}
            >
              <Text
                style={[styles.chipLabel, statusFilter === 'ongoing' && styles.chipLabelActive]}
              >
                Ongoing
              </Text>
              <Text
                style={[styles.chipCount, statusFilter === 'ongoing' && styles.chipCountActive]}
              >
                {ongoingCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, statusFilter === 'resolved' && styles.chipActive]}
              onPress={() => onStatusFilterChange('resolved')}
            >
              <Text
                style={[styles.chipLabel, statusFilter === 'resolved' && styles.chipLabelActive]}
              >
                Resolved
              </Text>
              <Text
                style={[styles.chipCount, statusFilter === 'resolved' && styles.chipCountActive]}
              >
                {resolvedCount}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Report Type (UI only for now) */}
          <Text style={styles.modalSectionTitle}>Report Type</Text>
          <View style={styles.chipGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, reportTypeFilter === 'all' && styles.chipActive]}
              onPress={() => onReportTypeFilterChange('all')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  reportTypeFilter === 'all' && styles.chipLabelActive,
                ]}
              >
                All Types
              </Text>
              <Text
                style={[
                  styles.chipCount,
                  reportTypeFilter === 'all' && styles.chipCountActive,
                ]}
              >
                {totalCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, reportTypeFilter === 'manual' && styles.chipActive]}
              onPress={() => onReportTypeFilterChange('manual')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  reportTypeFilter === 'manual' && styles.chipLabelActive,
                ]}
              >
                Manual
              </Text>
              <Text
                style={[
                  styles.chipCount,
                  reportTypeFilter === 'manual' && styles.chipCountActive,
                ]}
              >
                {totalCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.chip, reportTypeFilter === 'voice' && styles.chipActive]}
              onPress={() => onReportTypeFilterChange('voice')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  reportTypeFilter === 'voice' && styles.chipLabelActive,
                ]}
              >
                Voice
              </Text>
              <Text
                style={[
                  styles.chipCount,
                  reportTypeFilter === 'voice' && styles.chipCountActive,
                ]}
              >
                {totalCount}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              activeOpacity={0.8}
              onPress={onClearAll}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  chipGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  chipActive: {
    backgroundColor: colors.primary.blue,
  },
  chipLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  chipLabelActive: {
    color: colors.text.inverse,
  },
  chipCount: {
    minWidth: 36,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  chipCountActive: {
    backgroundColor: '#e5edff',
    color: '#1e3a8a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f8fafc',
  },
  modalButtonPrimary: {
    backgroundColor: '#4b5563',
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#ffffff',
  },
  modalButtonTextSecondary: {
    color: '#0f172a',
  },
});


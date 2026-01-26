/**
 * Reject Sheet Component
 * Allows Purok Leader to manually reject invalid/spam concerns
 */

import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import {
  formatReportId,
  formatDateReadable,
  formatTime12Hour,
  cleanTitle,
} from '@/utils/reportHelpers';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// Predefined rejection reasons for quick selection
const REJECTION_REASONS = [
  { id: 'false_alarm', label: 'False Alarm', description: 'No actual incident at reported location' },
  { id: 'spam', label: 'Spam/Test', description: 'Test submission or spam content' },
  { id: 'duplicate', label: 'Duplicate', description: 'Already reported by another citizen' },
  { id: 'out_of_area', label: 'Out of Area', description: 'Location outside assigned jurisdiction' },
  { id: 'incomplete', label: 'Incomplete Info', description: 'Not enough details to act upon' },
  { id: 'other', label: 'Other', description: 'Specify custom reason' },
];

export interface RejectSheetProps {
  visible: boolean;
  report: EmergencyReport | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectSheet({ visible, report, onConfirm, onCancel }: RejectSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  // Reset state when modal closes or report changes
  React.useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setCustomReason('');
    }
  }, [visible]);

  if (!report) return null;

  const handleConfirm = () => {
    if (!selectedReason) return;

    let reason = '';
    if (selectedReason === 'other') {
      reason = customReason.trim() || 'Rejected by Purok Leader';
    } else {
      const preset = REJECTION_REASONS.find(r => r.id === selectedReason);
      reason = preset?.label || 'Rejected by Purok Leader';
    }
    
    onConfirm(reason);
    setSelectedReason(null);
    setCustomReason('');
  };

  const isValid = selectedReason && (selectedReason !== 'other' || customReason.trim().length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="close-circle" size={28} color={colors.semantic.error} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Reject Report</Text>
                <Text style={styles.modalSubtitle}>Mark this concern as invalid</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Report Summary */}
          <ScrollView 
            style={styles.insightsContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Report ID Badge */}
            <View style={styles.idBadgeContainer}>
              <Text style={styles.idLabel}>Report ID</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>{formatReportId(report.id)}</Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Concern</Text>
              <Text style={styles.titleText}>{cleanTitle(report.title)}</Text>
              <Text style={styles.dateText}>
                {formatDateReadable(report.timestamp)} {formatTime12Hour(report.timestamp)}
              </Text>
            </View>

            {/* Warning Message */}
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={colors.semantic.warning} />
              <Text style={styles.warningText}>
                Rejecting this concern will notify the citizen that their report was marked as invalid. 
                This action cannot be undone.
              </Text>
            </View>

            {/* Rejection Reason Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reason for Rejection</Text>
              <View style={styles.reasonsContainer}>
                {REJECTION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason.id && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reasonHeader}>
                      <View style={[
                        styles.radioOuter,
                        selectedReason === reason.id && styles.radioOuterSelected,
                      ]}>
                        {selectedReason === reason.id && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[
                        styles.reasonLabel,
                        selectedReason === reason.id && styles.reasonLabelSelected,
                      ]}>
                        {reason.label}
                      </Text>
                    </View>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Reason Input (when "Other" is selected) */}
            {selectedReason === 'other' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Specify Reason</Text>
                <View style={styles.remarksInputContainer}>
                  <TextInput
                    style={styles.remarksInput}
                    placeholder="Enter the reason for rejection..."
                    placeholderTextColor={colors.text.tertiary}
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.characterCount}>
                    {customReason.length}/500
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              activeOpacity={0.8}
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.modalButtonDanger,
                !isValid && styles.modalButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.inverse} style={{ marginRight: 8 }} />
              <Text style={styles.modalButtonText}>Reject Report</Text>
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
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg * (isTablet ? 1.5 : 1),
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    borderWidth: 2,
    borderColor: '#fecaca', // Red tint border
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.semantic.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.error,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  insightsContainer: {
    maxHeight: 450,
    marginBottom: spacing.lg,
  },
  idBadgeContainer: {
    marginBottom: spacing.lg,
  },
  idLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  idText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.lg * 1.4,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7', // amber-100
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#fcd34d', // amber-300
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#92400e', // amber-800
    lineHeight: typography.fontSize.sm * 1.5,
  },
  reasonsContainer: {
    gap: spacing.sm,
  },
  reasonOption: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  reasonOptionSelected: {
    borderColor: colors.semantic.error,
    backgroundColor: colors.semantic.error + '08',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.semantic.error,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.semantic.error,
  },
  reasonLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  reasonLabelSelected: {
    color: colors.semantic.error,
  },
  reasonDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: 28, // Align with label (radio width + gap)
  },
  remarksInputContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
  },
  remarksInput: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    minHeight: 80,
    maxHeight: 120,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
    paddingRight: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonSecondary: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalButtonDanger: {
    backgroundColor: colors.semantic.error,
  },
  modalButtonDisabled: {
    backgroundColor: colors.neutral.gray400,
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
  modalButtonTextSecondary: {
    color: colors.text.primary,
  },
});

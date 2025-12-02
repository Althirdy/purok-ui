import { DesignSystem } from '@/constants/design-system';
import type { EmergencyReport } from '@/types';
import React from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { colors, typography, spacing, shadows } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

export interface ResolveSheetProps {
  visible: boolean;
  report: EmergencyReport | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResolveSheet({ visible, report, onConfirm, onCancel }: ResolveSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Resolve Concern</Text>
          <Text style={styles.modalSectionTitle}>
            Are you sure you want to mark this concern as resolved?
          </Text>
          {report && (
            <Text style={styles.reportTitle}>{report.title}</Text>
          )}
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
              style={[styles.modalButton, styles.modalButtonPrimary]}
              activeOpacity={0.8}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>Mark as Resolved</Text>
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
    borderColor: '#e2e8f0',
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.base * 1.5,
  },
  reportTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.blue,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary.blue,
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


import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface FilterModalProps {
  visible: boolean;
  statusFilter: 'all' | 'pending' | 'ongoing' | 'resolved';
  reportTypeFilter: 'all' | 'manual' | 'voice';
  totalCount: number;
  pendingCount: number;
  ongoingCount: number;
  resolvedCount: number;
  manualCount: number; // Count of manual reports
  voiceCount: number; // Count of voice reports
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
  manualCount,
  voiceCount,
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
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Concerns</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'all' && styles.filterOptionActive,
                  ]}
                  onPress={() => onStatusFilterChange('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === 'all' && styles.filterOptionTextActive,
                    ]}
                  >
                    All
                  </Text>
                  <View style={[styles.filterBadge, statusFilter === 'all' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, statusFilter === 'all' && styles.filterBadgeTextActive]}>
                      {totalCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'pending' && styles.filterOptionActive,
                  ]}
                  onPress={() => onStatusFilterChange('pending')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time" size={18} color={statusFilter === 'pending' ? '#ffffff' : '#f59e0b'} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === 'pending' && styles.filterOptionTextActive,
                    ]}
                  >
                    Pending
                  </Text>
                  <View style={[styles.filterBadge, statusFilter === 'pending' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, statusFilter === 'pending' && styles.filterBadgeTextActive]}>
                      {pendingCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'ongoing' && styles.filterOptionActive,
                  ]}
                  onPress={() => onStatusFilterChange('ongoing')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sync" size={18} color={statusFilter === 'ongoing' ? '#ffffff' : '#3b82f6'} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === 'ongoing' && styles.filterOptionTextActive,
                    ]}
                  >
                    Ongoing
                  </Text>
                  <View style={[styles.filterBadge, statusFilter === 'ongoing' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, statusFilter === 'ongoing' && styles.filterBadgeTextActive]}>
                      {ongoingCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'resolved' && styles.filterOptionActive,
                  ]}
                  onPress={() => onStatusFilterChange('resolved')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle" size={18} color={statusFilter === 'resolved' ? '#ffffff' : '#22c55e'} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      statusFilter === 'resolved' && styles.filterOptionTextActive,
                    ]}
                  >
                    Resolved
                  </Text>
                  <View style={[styles.filterBadge, statusFilter === 'resolved' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, statusFilter === 'resolved' && styles.filterBadgeTextActive]}>
                      {resolvedCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Report Type</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    reportTypeFilter === 'all' && styles.filterOptionActive,
                  ]}
                  onPress={() => onReportTypeFilterChange('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      reportTypeFilter === 'all' && styles.filterOptionTextActive,
                    ]}
                  >
                    All Types
                  </Text>
                  <View style={[styles.filterBadge, reportTypeFilter === 'all' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, reportTypeFilter === 'all' && styles.filterBadgeTextActive]}>
                      {totalCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    reportTypeFilter === 'manual' && styles.filterOptionActive,
                  ]}
                  onPress={() => onReportTypeFilterChange('manual')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create" size={18} color={reportTypeFilter === 'manual' ? '#ffffff' : '#64748b'} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      reportTypeFilter === 'manual' && styles.filterOptionTextActive,
                    ]}
                  >
                    Manual
                  </Text>
                  <View style={[styles.filterBadge, reportTypeFilter === 'manual' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, reportTypeFilter === 'manual' && styles.filterBadgeTextActive]}>
                      {manualCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    reportTypeFilter === 'voice' && styles.filterOptionActive,
                  ]}
                  onPress={() => onReportTypeFilterChange('voice')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mic" size={18} color={reportTypeFilter === 'voice' ? '#ffffff' : '#64748b'} />
                  <Text
                    style={[
                      styles.filterOptionText,
                      reportTypeFilter === 'voice' && styles.filterOptionTextActive,
                    ]}
                  >
                    Voice
                  </Text>
                  <View style={[styles.filterBadge, reportTypeFilter === 'voice' && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, reportTypeFilter === 'voice' && styles.filterBadgeTextActive]}>
                      {voiceCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              activeOpacity={0.7}
              onPress={onClearAll}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  filterOptionActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  filterOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  filterBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterBadgeTextActive: {
    color: '#1e3a8a',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});


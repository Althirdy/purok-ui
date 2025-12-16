import { Skeleton } from '@/components/common/skeleton';
import { DesignSystem } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const { spacing, borderRadius } = DesignSystem;

export function ProfileSkeleton() {
  return (
    <View>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <Skeleton style={styles.avatar} />
          <View style={styles.headerTextBlock}>
            <Skeleton style={styles.nameLine} />
            <Skeleton style={styles.subLine} />
          </View>
        </View>
        <Skeleton style={styles.badge} />
      </View>

      {/* Contact section */}
      <View style={styles.sectionCard}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.itemLabel} />
        <Skeleton style={styles.itemValue} />
        <Skeleton style={[styles.itemLabel, { marginTop: spacing.md }]} />
        <Skeleton style={styles.itemValue} />
      </View>

      {/* Settings section */}
      <View style={styles.sectionCard}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.settingRow} />
        <Skeleton style={styles.settingRow} />
        <Skeleton style={styles.settingRow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
  },
  nameLine: {
    height: 16,
    marginBottom: spacing.xs,
  },
  subLine: {
    height: 12,
    width: '60%',
  },
  badge: {
    height: 18,
    width: '40%',
    marginTop: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    height: 16,
    width: '40%',
    marginBottom: spacing.lg,
  },
  itemLabel: {
    height: 12,
    width: '35%',
    marginBottom: spacing.xs,
  },
  itemValue: {
    height: 14,
    width: '70%',
  },
  settingRow: {
    height: 18,
    width: '80%',
    marginBottom: spacing.md,
  },
});

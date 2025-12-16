import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DesignSystem } from '@/constants/design-system';
import { Skeleton } from '@/components/common/skeleton';

const { spacing, borderRadius } = DesignSystem;

interface ReportCardSkeletonProps {
  count?: number;
}

export function ReportCardSkeleton({ count = 3 }: ReportCardSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.row}>
            <Skeleton style={styles.avatar} />
            <View style={styles.textBlock}>
              <Skeleton style={styles.title} />
              <Skeleton style={styles.subtitle} />
            </View>
          </View>
          <Skeleton style={styles.body} />
          <View style={styles.footerRow}>
            <Skeleton style={styles.footerLeft} />
            <Skeleton style={styles.footerRight} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: 0,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    height: 14,
    marginBottom: spacing.xs,
  },
  subtitle: {
    height: 12,
    width: '60%',
  },
  body: {
    height: 40,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    height: 12,
    width: '30%',
  },
  footerRight: {
    height: 12,
    width: '20%',
  },
});





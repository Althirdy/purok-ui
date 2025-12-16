import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DesignSystem } from '@/constants/design-system';
import { Skeleton } from '@/components/common/skeleton';

const { spacing, borderRadius } = DesignSystem;

interface NotificationSkeletonProps {
  count?: number;
}

export function NotificationSkeleton({ count = 5 }: NotificationSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.row}>
            <Skeleton style={styles.icon} />
            <View style={styles.textBlock}>
              <Skeleton style={styles.title} />
              <Skeleton style={styles.body} />
              <Skeleton style={styles.timestamp} />
            </View>
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
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  row: {
    flexDirection: 'row',
  },
  icon: {
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
  body: {
    height: 24,
    marginBottom: spacing.xs,
  },
  timestamp: {
    height: 10,
    width: '35%',
  },
});



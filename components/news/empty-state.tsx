import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface EmptyStateProps {
  loading?: boolean;
  feedType?: 'concerns' | 'anomalies';
}

export function EmptyState({ loading = false, feedType = 'concerns' }: EmptyStateProps) {
  const isAnomalies = feedType === 'anomalies';
  
  return (
    <View style={styles.container}>
      <Ionicons 
        name={isAnomalies ? "radio-outline" : "folder-open-outline"} 
        size={64} 
        color={colors.neutral.gray600} 
      />
      <Text style={styles.text}>
        {loading 
          ? (isAnomalies ? 'Loading anomalies...' : 'Loading concerns...') 
          : (isAnomalies ? 'No anomalies available' : 'No concerns available')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  text: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
















import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, typography, spacing } = DesignSystem;

interface EmptyStateProps {
  loading?: boolean;
}

export function EmptyState({ loading = false }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="folder-open-outline" size={64} color={colors.neutral.gray600} />
      <Text style={styles.text}>
        {loading ? 'Loading reports...' : 'No reports available'}
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





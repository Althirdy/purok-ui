import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { DesignSystem } from '@/constants/design-system';

const { colors, borderRadius } = DesignSystem;

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ style }: SkeletonProps) {
  return <View style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
});



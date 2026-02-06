/**
 * Map Legend Component
 * 
 * Shows legend for purok territories at the bottom of the map.
 */

import { DesignSystem } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const { colors, borderRadius, typography, spacing } = DesignSystem;

export function MapLegend() {
    return (
        <View style={styles.legend}>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Purok</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>Selected</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    legend: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: colors.border.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        fontWeight: '500',
    },
});

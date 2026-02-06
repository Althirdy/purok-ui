/**
 * Purok Info Card Component
 * 
 * Simple bottom sheet that shows purok name when a territory is tapped.
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, spacing, borderRadius, typography } = DesignSystem;

interface PurokInfoCardProps {
    name: string;
    description?: string;
    onClose: () => void;
}

export function PurokInfoCard({ name, description, onClose }: PurokInfoCardProps) {
    return (
        <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={styles.card}>
                {/* Close button */}
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>

                {/* Header with location icon */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location" size={24} color="#fff" />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>📍 {name}</Text>
                        <Text style={styles.subtitle}>Purok Territory</Text>
                    </View>
                </View>

                {/* Description if available */}
                {description && (
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>{description}</Text>
                    </View>
                )}

                {/* Close button */}
                <Pressable style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Close</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    },
    backdrop: {
        flex: 1,
    },
    card: {
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        paddingBottom: spacing['2xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 24,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border.light,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        padding: spacing.sm,
        zIndex: 10,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.full,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.lg,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerText: {
        flex: 1,
        paddingRight: spacing['2xl'],
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    descriptionBox: {
        backgroundColor: colors.background.secondary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    descriptionText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#3B82F6',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

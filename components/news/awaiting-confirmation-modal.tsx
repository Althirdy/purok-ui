import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { colors, typography, spacing } = DesignSystem;

export interface AwaitingConfirmationModalProps {
    visible: boolean;
    concernTitle?: string;
    onDismiss: () => void;
}

export function AwaitingConfirmationModal({
    visible,
    concernTitle,
    onDismiss,
}: AwaitingConfirmationModalProps) {
    // Pulse animation for the hourglass icon
    const pulseAnim = useRef(new Animated.Value(1)).current;
    // Rotation animation for the hourglass
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Pulse animation
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );

            // Gentle rotation
            const rotate = Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );

            pulse.start();
            rotate.start();

            return () => {
                pulse.stop();
                rotate.stop();
            };
        }
    }, [visible, pulseAnim, rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '15deg'],
    });

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Animated Icon */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                transform: [{ scale: pulseAnim }, { rotate: spin }],
                            },
                        ]}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="hourglass-outline" size={40} color="#F97316" />
                        </View>
                    </Animated.View>

                    {/* Title */}
                    <Text style={styles.title}>Awaiting Citizen Confirmation</Text>

                    {/* Concern title if available */}
                    {concernTitle && (
                        <View style={styles.concernBadge}>
                            <Ionicons name="document-text-outline" size={14} color={colors.text.secondary} />
                            <Text style={styles.concernTitle} numberOfLines={2}>
                                {concernTitle}
                            </Text>
                        </View>
                    )}

                    {/* Description */}
                    <Text style={styles.description}>
                        The citizen has been notified and needs to confirm that this concern has been resolved.
                    </Text>

                    {/* Info cards */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="notifications-outline" size={18} color={colors.primary.blue} />
                            </View>
                            <Text style={styles.infoText}>
                                The citizen will receive a notification to confirm
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="time-outline" size={18} color="#F97316" />
                            </View>
                            <Text style={styles.infoText}>
                                If no response after 2 hours, you can resolve again
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.text.secondary} />
                            </View>
                            <Text style={styles.infoText}>
                                The resolve button will be locked until confirmed
                            </Text>
                        </View>
                    </View>

                    {/* Dismiss Button */}
                    <TouchableOpacity
                        style={styles.dismissButton}
                        activeOpacity={0.8}
                        onPress={onDismiss}
                    >
                        <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                        <Text style={styles.dismissButtonText}>OK, Got it</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        backgroundColor: colors.background.card,
        borderRadius: 24,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.light,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF7ED',
        borderWidth: 3,
        borderColor: '#FDBA7420',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    concernBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 8,
        gap: 6,
        marginBottom: spacing.md,
        maxWidth: '100%',
    },
    concernTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        flex: 1,
    },
    description: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: typography.fontSize.base * 1.5,
        marginBottom: spacing.lg,
    },
    infoSection: {
        width: '100%',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing.md,
        borderRadius: 12,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        flex: 1,
        lineHeight: typography.fontSize.sm * 1.4,
    },
    dismissButton: {
        backgroundColor: colors.primary.blue,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        width: '100%',
        minHeight: 48,
    },
    dismissButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.inverse,
    },
});

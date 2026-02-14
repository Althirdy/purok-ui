/**
 * Change PIN Screen - Forced PIN change for Purok Leaders with operator-generated PINs
 */

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { changePin } from '@/services/pin-service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

type PinField = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
    const router = useRouter();
    const { accessToken, updateTokensAfterPinChange } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // PIN state for each field
    const [currentPin, setCurrentPin] = useState(['', '', '', '']);
    const [newPin, setNewPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [activeField, setActiveField] = useState<PinField>('current');

    // Refs for each PIN input
    const currentRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];
    const newRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];
    const confirmRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];

    const getRefsForField = (field: PinField) => {
        switch (field) {
            case 'current': return currentRefs;
            case 'new': return newRefs;
            case 'confirm': return confirmRefs;
        }
    };

    const getSetterForField = (field: PinField) => {
        switch (field) {
            case 'current': return setCurrentPin;
            case 'new': return setNewPin;
            case 'confirm': return setConfirmPin;
        }
    };

    const getPinForField = (field: PinField) => {
        switch (field) {
            case 'current': return currentPin;
            case 'new': return newPin;
            case 'confirm': return confirmPin;
        }
    };

    const getNextField = (field: PinField): PinField | null => {
        switch (field) {
            case 'current': return 'new';
            case 'new': return 'confirm';
            case 'confirm': return null;
        }
    };

    const handleChange = (value: string, index: number, field: PinField) => {
        const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
        if (errorMessage) setErrorMessage('');

        const pin = [...getPinForField(field)];
        pin[index] = sanitized;
        getSetterForField(field)(pin);

        if (sanitized) {
            const refs = getRefsForField(field);
            if (index < 3) {
                refs[index + 1].current?.focus();
            } else {
                // Last digit of this field — move to next field or try submit
                const nextField = getNextField(field);
                if (nextField) {
                    setActiveField(nextField);
                    const nextRefs = getRefsForField(nextField);
                    nextRefs[0].current?.focus();
                } else {
                    // All fields filled — auto-submit
                    const currentStr = field === 'current' ? pin.join('') : currentPin.join('');
                    const newStr = field === 'new' ? pin.join('') : newPin.join('');
                    const confirmStr = field === 'confirm' ? pin.join('') : confirmPin.join('');
                    if (currentStr.length === 4 && newStr.length === 4 && confirmStr.length === 4) {
                        handleSubmit(currentStr, newStr, confirmStr);
                    }
                }
            }
        }
    };

    const handleKeyPress = (e: any, index: number, field: PinField) => {
        const pin = getPinForField(field);
        const refs = getRefsForField(field);
        if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
            refs[index - 1].current?.focus();
            const updated = [...pin];
            updated[index - 1] = '';
            getSetterForField(field)(updated);
        }
    };

    const handleSubmit = async (currentStr: string, newStr: string, confirmStr: string) => {
        if (!accessToken) {
            setErrorMessage('Not authenticated. Please log in again.');
            return;
        }

        // Client-side validation
        if (currentStr.length !== 4 || newStr.length !== 4 || confirmStr.length !== 4) {
            setErrorMessage('Please fill in all PIN fields.');
            return;
        }

        if (newStr === currentStr) {
            setErrorMessage('New PIN must be different from current PIN.');
            return;
        }

        if (newStr !== confirmStr) {
            setErrorMessage('New PIN and confirmation do not match.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const result = await changePin(accessToken, currentStr, newStr, confirmStr);

            if (result.success && result.data) {
                // Update tokens in auth context
                await updateTokensAfterPinChange(result.data.token, result.data.refreshToken);

                Alert.alert(
                    'PIN Changed',
                    'Your PIN has been changed successfully. You now have full access.',
                    [{ text: 'Continue', onPress: () => router.replace('/(tabs)/news-feed') }],
                );
            } else {
                setErrorMessage(result.message || 'Failed to change PIN.');
                resetAllPins();
            }
        } catch (err: any) {
            const message = typeof err?.message === 'string' ? err.message : 'Failed to change PIN. Please try again.';
            setErrorMessage(message);
            resetAllPins();
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAllPins = () => {
        setCurrentPin(['', '', '', '']);
        setNewPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        setActiveField('current');
        currentRefs[0].current?.focus();
    };

    const renderPinRow = (label: string, pin: string[], field: PinField) => {
        const refs = getRefsForField(field);
        return (
            <View style={styles.pinGroup}>
                <Text style={styles.pinLabel}>{label}</Text>
                <View style={styles.pinDots}>
                    {pin.map((digit, index) => (
                        <TextInput
                            key={`${field}-${index}`}
                            ref={refs[index]}
                            style={[
                                styles.pinBox,
                                activeField === field && styles.pinBoxActive,
                                !!errorMessage && styles.pinBoxError,
                            ]}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index, field)}
                            onFocus={() => setActiveField(field)}
                            onKeyPress={(e) => handleKeyPress(e, index, field)}
                            keyboardType="number-pad"
                            maxLength={1}
                            secureTextEntry
                            autoCorrect={false}
                            editable={!isSubmitting}
                        />
                    ))}
                </View>
            </View>
        );
    };

    return (
        <>
            <SafeAreaView style={globalStyles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.headerSection}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="lock-closed" size={32} color="#1e3a8a" />
                            </View>
                            <Text style={styles.title}>Change Your PIN</Text>
                            <Text style={styles.subtitle}>
                                For your security, you must change your operator-assigned PIN before accessing the app.
                            </Text>
                        </View>

                        {/* Alert Banner */}
                        <View style={styles.alertBanner}>
                            <Ionicons name="shield-checkmark" size={20} color="#b45309" />
                            <Text style={styles.alertText}>
                                This ensures only you know your PIN. Your operator will no longer have access.
                            </Text>
                        </View>

                        {/* PIN Fields */}
                        <View style={styles.formSection}>
                            {renderPinRow('Current PIN', currentPin, 'current')}
                            {renderPinRow('New PIN', newPin, 'new')}
                            {renderPinRow('Confirm New PIN', confirmPin, 'confirm')}
                        </View>

                        {/* Error Message */}
                        {!!errorMessage && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}

                        {/* Spacer */}
                        <View style={{ flex: 1 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            {isSubmitting && <LoadingSpinner />}
        </>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.primary.navy,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: spacing.md,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fcd34d',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.xl,
        gap: 10,
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
    },
    formSection: {
        gap: spacing.lg,
    },
    pinGroup: {
        alignItems: 'center',
    },
    pinLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    pinDots: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    pinBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: colors.background.secondary,
        borderWidth: 1.5,
        borderColor: colors.border.default,
        textAlign: 'center',
        fontSize: typography.fontSize.xl,
        color: colors.text.primary,
    },
    pinBoxActive: {
        borderColor: '#1e3a8a',
    },
    pinBoxError: {
        borderColor: '#dc2626',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        gap: 6,
    },
    errorText: {
        color: '#dc2626',
        fontSize: typography.fontSize.sm,
    },
});

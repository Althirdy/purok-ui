/**
 * Login Screen — 2-step flow inspired by GlobeOne
 * Step 1: ID Number entry → verify against backend
 * Step 2: GlobeOne-style screen with ID pill, PIN boxes, polished layout
 */

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DesignSystem } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;
const PIN_LENGTH = 4;

export default function LoginScreen() {
  const router = useRouter();
  const {
    verifyId,
    loginWithCredentials,
    isSubmitting,
    idNumber: savedIdNumber,
    verifiedName: savedVerifiedName,
    clearVerifiedId,
  } = useAuth();

  // ─── Step state ──────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [idInput, setIdInput] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedId, setVerifiedId] = useState('');
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const idInputRef = useRef<TextInput>(null);
  const pinRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Fade animation for step transitions
  const step1Opacity = useRef(new Animated.Value(1)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;

  // ─── Auto-skip to Step 2 for returning users ─────────
  useEffect(() => {
    if (savedIdNumber && savedVerifiedName) {
      setVerifiedId(savedIdNumber);
      setVerifiedName(savedVerifiedName);
      setIdInput(savedIdNumber);
      showStep2(false);
    }
  }, [savedIdNumber, savedVerifiedName]);

  // ─── Transition helpers ──────────────────────────────
  const showStep2 = (animate = true) => {
    setStep(2);
    setErrorMessage('');
    setPin(['', '', '', '']);
    setActiveIndex(0);
    if (animate) {
      Animated.parallel([
        Animated.timing(step1Opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(step2Opacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => pinRefs[0].current?.focus(), 100);
      });
    } else {
      step1Opacity.setValue(0);
      step2Opacity.setValue(1);
      setTimeout(() => pinRefs[0].current?.focus(), 300);
    }
  };

  const showStep1 = () => {
    setStep(1);
    setErrorMessage('');
    setPin(['', '', '', '']);
    setVerifiedName('');
    setVerifiedId('');
    setIdInput('');
    clearVerifiedId();
    Animated.parallel([
      Animated.timing(step1Opacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(step2Opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => idInputRef.current?.focus(), 100);
    });
  };

  // ─── Step 1: Verify ID ──────────────────────────────
  const handleVerifyId = async () => {
    const trimmed = idInput.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your ID Number.');
      return;
    }
    setErrorMessage('');
    try {
      const result = await verifyId(trimmed);
      setVerifiedName(result.name);
      setVerifiedId(result.id_number);
      showStep2();
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'ID Number not found.';
      setErrorMessage(msg);
    }
  };

  // ─── Step 2: PIN input handling ─────────────────────
  const handlePinChange = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    if (errorMessage) setErrorMessage('');
    const nextPin = [...pin];
    nextPin[index] = sanitized;
    setPin(nextPin);

    if (sanitized) {
      if (index < 3) {
        pinRefs[index + 1].current?.focus();
        setActiveIndex(index + 1);
      } else {
        const pinString = nextPin.join('');
        if (pinString.length === PIN_LENGTH) handleLogin(pinString);
      }
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
      pinRefs[index - 1].current?.focus();
      setActiveIndex(index - 1);
      const nextPin = [...pin];
      nextPin[index - 1] = '';
      setPin(nextPin);
    }
  };

  const handleLogin = async (pinString: string) => {
    try {
      await loginWithCredentials(verifiedId, pinString);
      router.replace('/(tabs)/news-feed');
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'Invalid PIN. Please try again.';
      setErrorMessage(msg);
      setPin(['', '', '', '']);
      setActiveIndex(0);
      pinRefs[0].current?.focus();
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* ═══════════ STEP 1: ID NUMBER ═══════════ */}
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: step1Opacity },
              step === 2 && styles.stepHidden,
            ]}
            pointerEvents={step === 1 ? 'auto' : 'none'}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/urbanwatchicondark.png')}
                  style={{ width: 72, height: 72 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>UrbanWatch</Text>
              <Text style={styles.step1Subtitle}>Purok Officials</Text>
            </View>

            {/* ID Input */}
            <View style={styles.idSection}>
              <Text style={styles.idLabel}>Enter your ID Number</Text>
              <View style={[
                styles.idInputContainer,
                !!errorMessage && step === 1 && styles.inputError,
              ]}>
                <Ionicons
                  name="id-card-outline"
                  size={20}
                  color={errorMessage && step === 1 ? '#dc2626' : colors.text.tertiary}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  ref={idInputRef}
                  style={styles.idInput}
                  value={idInput}
                  onChangeText={(text) => {
                    setIdInput(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="ID Number"
                  placeholderTextColor={colors.text.light}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onSubmitEditing={handleVerifyId}
                  returnKeyType="go"
                />
              </View>

              {!!errorMessage && step === 1 && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#dc2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleVerifyId}
                disabled={isSubmitting}
              >
                <Text style={styles.continueButtonText}>
                  {isSubmitting ? 'Verifying...' : 'Continue'}
                </Text>
              </Pressable>
            </View>

            <View style={{ flex: 1 }} />
          </Animated.View>

          {/* ═══════════ STEP 2: PIN (GlobeOne style) ═══════════ */}
          <Animated.View
            style={[
              styles.stepContainer,
              styles.step2Bg,
              { opacity: step2Opacity },
              step === 1 && styles.stepHidden,
            ]}
            pointerEvents={step === 2 ? 'auto' : 'none'}
          >
            <View style={styles.step2Inner}>
              {/* Logo */}
              <View style={styles.step2LogoSection}>
                <Image
                  source={require('@/assets/images/urbanwatchicondark.png')}
                  style={{ width: 60, height: 60 }}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <Text style={styles.step2Title}>Log In to UrbanWatch</Text>

              {/* ID Number Pill */}
              <View style={styles.idPill}>
                <Text style={styles.idPillText}>{verifiedId}</Text>
              </View>

              {/* Change ID Number link */}
              <Pressable
                onPress={showStep1}
                disabled={isSubmitting}
                style={styles.changeIdRow}
              >
                <Text style={styles.changeIdText}>Change ID Number</Text>
                <Ionicons name="swap-horizontal" size={14} color={colors.primary.blue} />
              </Pressable>

              {/* PIN Section — centered vertically in remaining space */}
              <View style={styles.pinSection}>
                <Text style={styles.pinLabel}>Enter your 4-digit PIN</Text>

                {/* PIN Input Boxes */}
                <View style={styles.pinRow}>
                  {pin.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={pinRefs[index]}
                      style={[
                        styles.pinBox,
                        index === activeIndex && step === 2 && styles.pinBoxActive,
                        !!errorMessage && step === 2 && styles.pinBoxError,
                      ]}
                      value={digit}
                      onChangeText={(text) => handlePinChange(text, index)}
                      onFocus={() => setActiveIndex(index)}
                      onKeyPress={(e) => handlePinKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      secureTextEntry
                      autoCorrect={false}
                      textContentType="oneTimeCode"
                      editable={!isSubmitting}
                    />
                  ))}
                </View>

                {/* Error */}
                {!!errorMessage && step === 2 && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#dc2626" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
              </View>

              {/* Bottom spacer */}
              <View style={{ flex: 1 }} />
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
      {isSubmitting && <LoadingSpinner />}
    </>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  stepContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  stepHidden: {
    zIndex: -1,
  },

  // ── Step 1 ───────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  step1Subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  idSection: {
    paddingHorizontal: spacing.lg,
  },
  idLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  idInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  idInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: typography.fontSize.sm,
  },
  continueButton: {
    backgroundColor: colors.primary.navy,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // ── Step 2 (GlobeOne-inspired) ───────────────────
  step2Bg: {
    backgroundColor: '#eef2fb',
  },
  step2Inner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  step2LogoSection: {
    marginBottom: spacing.md,
  },
  step2Title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  idPill: {
    borderWidth: 1.5,
    borderColor: colors.primary.navy,
    borderRadius: 999,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    backgroundColor: '#ffffff',
  },
  idPillText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.navy,
    letterSpacing: 1.5,
  },
  changeIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xl,
  },
  changeIdText: {
    color: colors.primary.blue,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },

  // ── PIN ──────────────────────────────────────────
  pinSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  pinLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  pinRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  pinBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  pinBoxActive: {
    borderColor: colors.primary.navy,
    borderWidth: 2,
  },
  pinBoxError: {
    borderColor: '#dc2626',
  },
});

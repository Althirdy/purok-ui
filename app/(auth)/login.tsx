/**
 * Login Screen with PIN Authentication
 */

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing } = DesignSystem;

// Inline styles
const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  pinSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  pinLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  pinDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pinBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    textAlign: 'center',
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  pinBoxActive: {
    borderColor: '#000',
  },
  forgotPin: {
    fontSize: typography.fontSize.sm,
    color: '#000',
    marginTop: spacing.sm,
  },
  numberPad: { flex: 1 },
  numberRow: {},
  numberButton: {},
  numberText: {},
  loginButton: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#dc2626',
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  pinBoxError: {
    borderColor: '#dc2626',
  },
});

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithPin, isSubmitting } = useAuth();
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  const handleChange = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    if (errorMessage) setErrorMessage('');
    const nextPin = [...pin];
    nextPin[index] = sanitized;
    setPin(nextPin);

    if (sanitized) {
      if (index < 3) {
        inputRefs[index + 1].current?.focus();
        setActiveIndex(index + 1);
      } else {
        const pinString = nextPin.join('');
        if (pinString.length === 4) handleLogin(pinString);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
      setActiveIndex(index - 1);
      const nextPin = [...pin];
      nextPin[index - 1] = '';
      setPin(nextPin);
    }
  };

  const handleLogin = async (pinString: string) => {
    if (pinString.length !== 4) {
      setErrorMessage('Please enter all 4 digits.');
      setPin(['', '', '', '']);
      setActiveIndex(0);
      inputRefs[0].current?.focus();
      return;
    }
    try {
      await loginWithPin(pinString);
      router.replace('/(tabs)/news-feed');
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : 'Incorrect PIN. Please try again.';
      setErrorMessage(message);
      setPin(['', '', '', '']);
      setActiveIndex(0);
      inputRefs[0].current?.focus();
    }
  };

  const handleForgotPin = () => {
    Alert.alert('Forgot PIN', 'Please contact your administrator to reset your PIN.');
  };

  return (
    <>
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary.navy} />
            </View>
          </View>
          <Text style={styles.appName}>UrbanWatch</Text>
          <Text style={styles.subtitle}>Purok Officials Portal</Text>
        </View>

        {/* PIN Input Section */}
        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Enter your 4 digit PIN:</Text>
          <View style={styles.pinDots}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.pinBox,
                  index === activeIndex && styles.pinBoxActive,
                  !!errorMessage && styles.pinBoxError,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onFocus={() => setActiveIndex(index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                autoCorrect={false}
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                editable={!isSubmitting}
              />
            ))}
          </View>

          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotPin}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to retain original layout where numpad used to be */}
        <View style={styles.numberPad} />

      </View>
    </SafeAreaView>
    {isSubmitting && <LoadingSpinner />}
    </>
  );
}

/**
 * Login Screen with PIN Authentication
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
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
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
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
    borderRadius: 10,
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
});

export default function LoginScreen() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  const handleChange = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
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

  const handleLogin = (pinString: string) => {
    if (pinString.length === 4) {
      router.replace('/(tabs)/news-feed');
    } else {
      Alert.alert('Error', 'Please enter all 4 digits.');
      setPin(['', '', '', '']);
      setActiveIndex(0);
      inputRefs[0].current?.focus();
    }
  };

  const handleForgotPin = () => {
    Alert.alert('Forgot PIN', 'Please contact your administrator to reset your PIN.');
  };

  return (
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
                style={[styles.pinBox, index === activeIndex && styles.pinBoxActive]}
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
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotPin}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to retain original layout where numpad used to be */}
        <View style={styles.numberPad} />

      </View>
    </SafeAreaView>
  );
}

/**
 * Login Screen with PIN Authentication
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.orange,
  },
  logoInner: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.orange,
  },
  logoText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.orange,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
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
  pinDot: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.neutral.gray600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    borderColor: colors.accent.orange,
  },
  pinDotActive: {
    borderColor: colors.accent.orange,
    backgroundColor: `${colors.accent.orange}20`,
  },
  pinDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent.orange,
  },
  forgotPin: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.orange,
    marginTop: spacing.sm,
  },
  numberPad: {
    flex: 1,
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  numberButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  loginButton: {
    marginBottom: spacing.md,
  },
});

export default function LoginScreen() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNumberPress = (num: number) => {
    if (activeIndex < 6) {
      const newPin = [...pin];
      newPin[activeIndex] = num.toString();
      setPin(newPin);
      setActiveIndex(activeIndex + 1);
      
      // Auto-login when all 6 digits entered
      if (activeIndex === 5) {
        setTimeout(() => {
          const pinString = [...newPin.slice(0, 5), num.toString()].join('');
          handleLogin(pinString);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    if (activeIndex > 0) {
      const newPin = [...pin];
      newPin[activeIndex - 1] = '';
      setPin(newPin);
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleLogin = (pinString: string) => {
    // Allow any PIN to login for now
    if (pinString.length === 6) {
      router.replace('/(tabs)/news-feed');
    } else {
      Alert.alert('Error', 'Please enter all 6 digits.');
      setPin(['', '', '', '', '', '']);
      setActiveIndex(0);
    }
  };

  const handleForgotPin = () => {
    Alert.alert('Forgot PIN', 'Please contact your administrator to reset your PIN.');
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>U</Text>
              </View>
            </View>
          </View>
          <Text style={styles.appName}>UrbanWatch</Text>
          <Text style={styles.subtitle}>Purok Officials Portal</Text>
        </View>

        {/* PIN Input Section */}
        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Enter your 6 digit PIN:</Text>
          
          <View style={styles.pinDots}>
            {pin.map((digit, index) => (
              <View 
                key={index}
                style={[
                  styles.pinDot,
                  digit !== '' && styles.pinDotFilled,
                  index === activeIndex && styles.pinDotActive,
                ]}
              >
                {digit !== '' && <View style={styles.pinDotInner} />}
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleForgotPin}>
            <Text style={styles.forgotPin}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          <View style={styles.numberRow}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => handleNumberPress(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => handleNumberPress(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => handleNumberPress(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            <View style={styles.numberButton} />
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => handleNumberPress(0)}
            >
              <Text style={styles.numberText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={handleBackspace}
            >
              <Text style={styles.numberText}>←</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

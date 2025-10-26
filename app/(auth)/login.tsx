/**
 * Login Screen with PIN Authentication
 */

import { globalStyles } from '@/constants/global-styles';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './login.styles';

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

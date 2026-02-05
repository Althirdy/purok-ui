/**
 * App Entry Point - Shows splash screen then redirects based on authentication state
 * Required for iOS to properly resolve the initial route
 */

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait for splash duration then navigate
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && !isInitializing) {
      if (isAuthenticated) {
        router.replace('/(tabs)/news-feed');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [showSplash, isInitializing, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/urbanwatchicondark.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>UrbanWatch</Text>
        <Text style={styles.subtitle}>Purok</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
});

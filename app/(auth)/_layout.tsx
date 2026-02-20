/**
 * Auth Layout
 */

import { useAuth } from '@/context/auth-context';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, isInitializing, requiresPinChange } = useAuth();
  if (isInitializing) return null;
  // If authenticated but needs PIN change, stay in auth group (change-pin screen)
  if (isAuthenticated && !requiresPinChange) {
    return <Redirect href="/(tabs)/news-feed" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="change-pin" />
    </Stack>
  );
}

/**
 * Auth Layout
 */

import { useAuth } from '@/context/auth-context';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/news-feed" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}


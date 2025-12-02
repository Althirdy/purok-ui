import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/auth-context';
import { useAuth } from '@/context/auth-context';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <AuthAwareStack />
      </AuthProvider>
      <StatusBar style="light" backgroundColor="#1f4ea8" translucent={false} />
    </>
  );
}

function AuthAwareStack() {
  const { isAuthenticated } = useAuth();
  return (
    <Stack key={isAuthenticated ? 'authed' : 'guest'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <NotificationProvider>
          <AuthAwareStack />
        </NotificationProvider>
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
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { QueryProvider } from '@/providers/QueryProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <>
      <QueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <AuthAwareStack />
          </NotificationProvider>
        </AuthProvider>
      </QueryProvider>
      {/* Match uw-citizen global header/nav color */}
      <StatusBar style="light" backgroundColor="#1e3a8a" translucent={false} />
    </>
  );
}

function AuthAwareStack() {
  const { isAuthenticated } = useAuth();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // When individual screens enable headers, use uw-citizen primary blue
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#ffffff',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="news/post-detail" />
    </Stack>
  );
}
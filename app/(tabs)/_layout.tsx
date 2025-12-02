import { Redirect, Tabs } from 'expo-router';

import { ModernTabBar } from '@/components/modern-tab-bar';
import { useAuth } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';

export const unstable_settings = {
  initialRouteName: 'news-feed',
};

export default function TabLayout() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <NotificationProvider>
      <Tabs
        tabBar={(props) => <ModernTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
      <Tabs.Screen
        name="news-feed"
        options={{
          title: 'Incident',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      
      {/* Hide notifications from tabs */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      
      
      {/* Removed Reports & History screen */}
      
      {/* Hide profile settings from tabs */}
      <Tabs.Screen
        name="profile-settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </NotificationProvider>
  );
}

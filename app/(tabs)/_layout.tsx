import { ModernTabBar } from '@/components/modern-tab-bar';
import { useAuth } from '@/context/auth-context';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

export const unstable_settings = {
  initialRouteName: 'news-feed',
};

export default function TabLayout() {
  const { isAuthenticated, isInitializing } = useAuth();

  // Lazy-load and configure notifications (works in both Expo Go and dev builds)
  useEffect(() => {
    // Use dynamic import to prevent crash in Expo Go
    const setupNotifications = async () => {
      try {
        const { configureNotifications, requestNotificationPermissions } = await import('@/services/notifications');
        configureNotifications();
        await requestNotificationPermissions();
        console.log('[TabLayout] ✅ Notifications configured');
      } catch (error) {
        // Gracefully handle - notifications just won't work in Expo Go
        console.log('[TabLayout] ⚠️ Push notifications not available (using Expo Go)');
      }
    };
    setupNotifications();
  }, []);

  if (isInitializing) return null;
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
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
  );
}

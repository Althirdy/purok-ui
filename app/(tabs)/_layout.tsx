import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

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
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#94a3b8',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e3a8a',
            borderTopWidth: 0,
            paddingTop: Platform.OS === 'android' ? 6 : 8,
            paddingBottom: Platform.OS === 'android' ? 8 : 4,
            height: Platform.OS === 'android' ? 58 : 52,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: Platform.OS === 'android' ? 4 : 2,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
        }}
      >
        <Tabs.Screen
          name="news-feed"
          options={{
            title: 'Incident',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: 'Safety News',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="newspaper-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        
        {/* Hide notifications from tabs */}
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        
        {/* Hide profile settings from tabs */}
        <Tabs.Screen
          name="profile-settings"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <StatusBar style="light" backgroundColor="#1e3a8a" />
    </>
  );
}

import { Tabs } from 'expo-router';

import { ModernTabBar } from '@/components/modern-tab-bar';

export const unstable_settings = {
  initialRouteName: 'news-feed',
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="news-feed"
        options={{
          title: 'News',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Incident',
        }}
      />
      
      {/* Hide notifications from tabs */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      
      {/* Hide emergency report from tabs */}
      <Tabs.Screen
        name="emergency-report"
        options={{
          href: null,
        }}
      />
      
      {/* Hide profile from tabs */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
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
  );
}

/**
 * Modern Tab Bar Component with visual containers
 */

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DesignSystem } from '@/constants/design-system';

const { colors, typography, spacing, borderRadius } = DesignSystem;

interface TabConfig {
  routeName: string;
  label: string;
  icon: (focused: boolean) => string;
}

const tabs: TabConfig[] = [
  {
    routeName: 'news-feed',
    label: 'Incident',
    icon: (focused) => focused ? 'newspaper' : 'newspaper-outline',
  },
  {
    routeName: 'map',
    label: 'Map',
    icon: (focused) => focused ? 'map' : 'map-outline',
  },
  {
    routeName: 'profile',
    label: 'Profile',
    icon: (focused) => focused ? 'person' : 'person-outline',
  },
];

export function ModernTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const handlePress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }

    // Haptic feedback
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const tabConfig = tabs.find(tab => tab.routeName === route.name);

        if (!tabConfig) return null;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={() => handlePress(route, isFocused)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            {isFocused && <View style={styles.activeUnderline} />}
            
            <View style={styles.iconContainer}>
              <Ionicons
                name={tabConfig.icon(isFocused) as any}
                size={isFocused ? 22 : 20}
                color={isFocused ? colors.text.inverse : colors.neutral.gray400}
              />
            </View>
            
            <Text
              style={[
                styles.label,
                isFocused && styles.labelActive,
              ]}
            >
              {tabConfig.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.primary.blue,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#1e3a8a',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs / 2,
    position: 'relative',
    zIndex: 1,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    backgroundColor: colors.accent.orange,
    borderRadius: borderRadius.sm,
  },
  iconContainer: {
    marginBottom: spacing.xs / 2,
    zIndex: 2,
  },
  label: {
    fontSize: typography.fontSize.xs * 0.9,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral.gray400,
    zIndex: 2,
  },
  labelActive: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
});

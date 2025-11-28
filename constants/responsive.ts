/**
 * Responsive Utilities for iOS and Android
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isTablet = SCREEN_WIDTH >= 768;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isPhone = !isTablet;

// Scale factor based on base width
export const scale = SCREEN_WIDTH / 375; // iPhone 6/7/8 as base

// Responsive scaling functions
export const scaleSize = (size: number) => Math.round(size * scale);

// Platform-specific adjustments
export const getResponsivePadding = (basePadding: number) => {
  return basePadding * (isTablet ? 1.5 : 1);
};

export const getResponsiveFontSize = (baseFontSize: number) => {
  if (isTablet) {
    return Math.round(baseFontSize * 1.2);
  }
  return baseFontSize;
};

export const getResponsiveIconSize = (baseSize: number) => {
  if (isTablet) {
    return Math.round(baseSize * 1.2);
  }
  return baseSize;
};

export { SCREEN_HEIGHT, SCREEN_WIDTH };


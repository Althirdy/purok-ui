/**
 * Global Design System for UrbanWatch Purok Officials App
 * All colors, typography, spacing, and styling constants
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline width (iPhone 11 / moderately sized modern phone)
const BASE_WIDTH = 375;

/**
 * Scaling utility for responsive UI
 * s(16) -> 16 on baseline, larger on wider devices, smaller on narrow ones.
 */
export const scale = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / BASE_WIDTH);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Moderate scale for values that shouldn't grow too fast (like margins/padding)
 */
export const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

export const DesignSystem = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: {
      blue: '#1e3a8a',
      blueLight: '#3b5fb0',
      blueDark: '#152a5e',
      navy: '#1e3a8a',
      navyDark: '#152a5e',
      navyLight: '#3b5fb0',
    },

    // Accent Colors
    accent: {
      orange: '#f59e0b',
      orangeLight: '#fbbf24',
      orangeDark: '#d97706',
    },

    // Neutral Colors
    neutral: {
      white: '#ffffff',
      gray100: '#f5f5f5',
      gray200: '#e5e5e5',
      gray300: '#d4d4d4',
      gray400: '#a3a3a3',
      gray500: '#737373',
      gray600: '#525252',
      gray700: '#404040',
      gray800: '#262626',
      gray900: '#171717',
    },

    // Semantic Colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      security: '#ef4444',
      resolved: '#10b981',
      investigating: '#8b5cf6',
      neutral: '#64748b',
    },

    // Text Colors
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#64748b',
      light: '#94a3b8',
      inverse: '#ffffff',
    },

    // Background Colors
    background: {
      primary: '#f8fafc',
      secondary: '#ffffff',
      card: '#ffffff',
      accent: '#f8fafc',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Border Colors
    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
      dark: '#cbd5e1',
    },
  },

  // Typography
  typography: {
    // Font Families
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },

    // Font Sizes - Normalized for accessibility and device size
    fontSize: {
      xs: scale(11),
      sm: scale(13),
      base: scale(15),
      lg: scale(17),
      xl: scale(19),
      '2xl': scale(22),
      '3xl': scale(26),
      '4xl': scale(30),
      '5xl': scale(34),
    },

    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },

    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing - Use moderate scale to keep it balanced
  spacing: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(16),
    lg: moderateScale(24),
    xl: moderateScale(32),
    '2xl': moderateScale(40),
    '3xl': moderateScale(48),
    '4xl': moderateScale(64),
  },

  // Border Radius
  borderRadius: {
    none: 0,
    sm: scale(6),
    md: scale(10),
    lg: scale(16),
    xl: scale(20),
    '2xl': scale(24),
    '3xl': scale(28),
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // Component Specific Styles
  components: {
    button: {
      primary: {
        height: scale(48),
        borderRadius: scale(12),
        paddingHorizontal: scale(24),
      },
      secondary: {
        height: scale(40),
        borderRadius: scale(12),
        paddingHorizontal: scale(20),
      },
      small: {
        height: scale(36),
        borderRadius: scale(10),
        paddingHorizontal: scale(16),
      },
    },

    card: {
      default: {
        borderRadius: scale(20),
        padding: scale(16),
      },
      large: {
        borderRadius: scale(24),
        padding: scale(24),
      },
    },

    input: {
      default: {
        height: scale(48),
        borderRadius: scale(12),
        paddingHorizontal: scale(16),
        fontSize: scale(16),
      },
    },
  },

  // Layout
  layout: {
    screenPadding: scale(20),
    containerMaxWidth: 480,
    windowWidth: SCREEN_WIDTH,
    windowHeight: SCREEN_HEIGHT,
  },
} as const;

// Export individual parts for easier imports
export const { colors, typography, spacing, borderRadius, shadows, components, layout } = DesignSystem;

// Type exports for TypeScript support
export type ColorPalette = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;


/**
 * Global Design System for UrbanWatch Purok Officials App
 * All colors, typography, spacing, and styling constants
 */

export const DesignSystem = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: {
      navy: '#1e2a3d',
      navyDark: '#151d2b',
      navyLight: '#2a3a52',
    },
    
    // Accent Colors
    accent: {
      orange: '#ff5a3d',
      orangeLight: '#ff7659',
      orangeDark: '#e64d33',
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
    },
    
    // Text Colors
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      tertiary: '#737373',
      inverse: '#1e2a3d',
    },
    
    // Background Colors
    background: {
      primary: '#1C2433',
      secondary: '#2A303E',
      card: '#2A303E',
      overlay: 'rgba(0, 0, 0, 0.5)',
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
    
    // Font Sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
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
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
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
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 24,
      },
      secondary: {
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 20,
      },
      small: {
        height: 36,
        borderRadius: 6,
        paddingHorizontal: 16,
      },
    },
    
    card: {
      default: {
        borderRadius: 12,
        padding: 16,
      },
      large: {
        borderRadius: 16,
        padding: 24,
      },
    },
    
    input: {
      default: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
      },
    },
  },
  
  // Layout
  layout: {
    screenPadding: 20,
    containerMaxWidth: 480,
  },
} as const;

// Export individual parts for easier imports
export const { colors, typography, spacing, borderRadius, shadows, components, layout } = DesignSystem;

// Type exports for TypeScript support
export type ColorPalette = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;


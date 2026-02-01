/**
 * Modern Toast Notification Component
 * Replaces native Alert with a sleek, non-intrusive notification
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius } = DesignSystem;

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface ToastData {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportType?: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  onPress?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ toast, onDismiss, duration = 5000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Position at top of screen, just below safe area (status bar)
  const toastTopPosition = insets.top + 8;

  useEffect(() => {
    if (!toast) {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Reset animations
    scaleAnim.setValue(0.9);

    // Animate in with bounce effect
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, slideAnim, opacityAnim, scaleAnim, duration, onDismiss]);

  if (!toast) return null;

  const getSeverityStyles = () => {
    // Check if this is a success toast (title contains ✅)
    const isSuccess = toast.title.includes('✅') || toast.title.toLowerCase().includes('success');
    // Check if this is an error toast (title contains ❌)
    const isError = toast.title.includes('❌') || toast.title.toLowerCase().includes('failed') || toast.title.toLowerCase().includes('error');
    
    // Success toast style
    if (isSuccess) {
      return {
        backgroundColor: '#dcfce7', // Light green background
        barColor: '#22c55e', // Green bar
        textColor: '#166534', // Dark green text
        icon: 'checkmark-circle' as any,
        iconColor: '#ffffff',
        closeColor: '#166534',
      };
    }
    
    // Error toast style
    if (isError) {
      return {
        backgroundColor: '#fee2e2', // Light red background
        barColor: '#ef4444', // Red bar
        textColor: '#991b1b', // Dark red text
        icon: 'close-circle' as any,
        iconColor: '#ffffff',
        closeColor: '#991b1b',
      };
    }
    
    // Determine icon based on report type first, then severity
    let icon: string;
    
    if (toast.reportType) {
      switch (toast.reportType) {
        case 'fire':
          icon = 'flame';
          break;
        case 'suspicious':
          icon = toast.severity === 'critical' ? 'alert-circle' : 'warning';
          break;
        case 'accident':
          icon = 'car';
          break;
        case 'medical':
          icon = 'medical';
          break;
        case 'crime':
          icon = 'shield';
          break;
        default:
          icon = toast.severity === 'critical' ? 'alert-circle' : 
                 toast.severity === 'high' ? 'warning' : 
                 toast.severity === 'medium' ? 'information-circle' : 
                 'notifications';
      }
    } else {
      // Fallback to severity-based icons
      icon = toast.severity === 'critical' ? 'alert-circle' : 
             toast.severity === 'high' ? 'warning' : 
             toast.severity === 'medium' ? 'information-circle' : 
             'notifications';
    }

    // Determine colors based on severity
    switch (toast.severity) {
      case 'critical':
        return {
          backgroundColor: '#fee2e2', // Light red background
          barColor: colors.semantic.error, // Dark red bar
          textColor: '#991b1b', // Dark red text
          icon: icon as any,
          iconColor: colors.text.inverse,
          closeColor: '#991b1b',
        };
      case 'high':
        return {
          backgroundColor: '#fef3c7', // Light yellow/orange background
          barColor: colors.semantic.warning, // Orange bar
          textColor: '#92400e', // Dark orange text
          icon: icon as any,
          iconColor: colors.text.inverse,
          closeColor: '#92400e',
        };
      case 'medium':
        return {
          backgroundColor: '#fef3c7', // Light yellow background
          barColor: colors.accent.orange, // Orange bar
          textColor: '#92400e', // Dark orange text
          icon: icon as any,
          iconColor: colors.text.inverse,
          closeColor: '#92400e',
        };
      default:
        return {
          backgroundColor: '#dbeafe', // Light blue background
          barColor: colors.semantic.info, // Blue bar
          textColor: '#1e40af', // Dark blue text
          icon: icon as any,
          iconColor: colors.text.inverse,
          closeColor: '#1e40af',
        };
    }
  };

  const severityStyles = getSeverityStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: toastTopPosition,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (toast.onPress) {
            toast.onPress();
          }
          onDismiss();
        }}
        style={styles.touchable}
      >
        <View
          style={[
            styles.toast,
            {
              backgroundColor: severityStyles.backgroundColor,
            },
          ]}
        >
          {/* Vertical colored bar with icon */}
          <View style={[styles.leftBar, { backgroundColor: severityStyles.barColor }]}>
            <Ionicons name={severityStyles.icon} size={20} color={severityStyles.iconColor} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.textContainer}>
              {/* Show title without emoji (emoji is replaced by icon) */}
              <Text style={[styles.title, { color: severityStyles.textColor }]} numberOfLines={1}>
                {toast.title.replace(/[✅❌📢🚨⚠️]/g, '').trim()}
              </Text>
              <Text style={[styles.message, { color: severityStyles.textColor }]} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={severityStyles.closeColor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: spacing.md,
  },
  touchable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
  toast: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 70,
  },
  leftBar: {
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
    fontWeight: typography.fontWeight.regular,
    opacity: 0.85,
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});


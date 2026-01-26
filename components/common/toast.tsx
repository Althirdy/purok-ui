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

  // Calculate position: below header (safe area + header ~100px + small padding)
  const toastTopPosition = insets.top + 100;

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
  },
  toast: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 60,
  },
  leftBar: {
    width: 48,
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
  message: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.5,
    fontWeight: typography.fontWeight.medium,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


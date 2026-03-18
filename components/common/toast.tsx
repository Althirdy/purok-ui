/**
 * System-style Toast Notification Component
 * Mimics iOS/Android system notification banner design
 * Dark translucent background with clean, modern typography
 * Uses Modal for proper full-screen overlay positioning
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { typography, spacing } = DesignSystem;

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

// Get a small accent color dot based on severity
function getAccentColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#FF453A';
    case 'high': return '#FF9F0A';
    case 'medium': return '#FFD60A';
    default: return '#30D158';
  }
}

// Get icon based on report type or severity
function getToastIcon(toast: ToastData): { name: string; color: string } {
  const accentColor = getAccentColor(toast.severity);

  if (toast.title.includes('✅') || toast.title.toLowerCase().includes('success')) {
    return { name: 'checkmark-circle-outline', color: '#30D158' };
  }
  if (toast.title.includes('❌') || toast.title.toLowerCase().includes('failed')) {
    return { name: 'close-circle-outline', color: '#FF453A' };
  }

  if (toast.reportType) {
    switch (toast.reportType) {
      case 'fire': return { name: 'flame-outline', color: accentColor };
      case 'accident': return { name: 'car-outline', color: accentColor };
      case 'medical': return { name: 'medkit-outline', color: accentColor };
      case 'crime': return { name: 'shield-outline', color: accentColor };
      case 'suspicious': return { name: 'eye-outline', color: accentColor };
      default: return { name: 'notifications-outline', color: accentColor };
    }
  }

  if (toast.title.includes('Anomaly') || toast.title.includes('🚨')) {
    return { name: 'alert-circle-outline', color: accentColor };
  }

  return { name: 'notifications-outline', color: accentColor };
}

export function Toast({ toast, onDismiss, duration = 5000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const toastTop = insets.top + 8;

  useEffect(() => {
    if (!toast) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [toast, translateY, opacity, duration, onDismiss]);

  if (!toast) return null;

  const icon = getToastIcon(toast);
  const cleanTitle = toast.title.replace(/[✅❌📢🚨⚠️🔔]/g, '').trim();

  return (
    <Modal
      visible={!!toast}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {
              top: toastTop,
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              toast.onPress?.();
              onDismiss();
            }}
            style={styles.touchable}
          >
            <View style={styles.toast}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: getAccentColor(toast.severity) + '20' }]}>
                <Ionicons name={icon.name as any} size={20} color={icon.color} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={styles.appLabel}>UrbanWatch</Text>
                  <Text style={styles.timeLabel}>now</Text>
                </View>
                <Text style={styles.title} numberOfLines={1}>{cleanTitle}</Text>
                <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
              </View>
            </View>

            {/* Drag indicator */}
            <View style={styles.dragIndicator} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  appLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.2,
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '400',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 19,
    fontWeight: '400',
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: -8,
    marginBottom: 6,
  },
});

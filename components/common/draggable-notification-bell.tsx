/**
 * Draggable Notification Bell Component
 * Users can drag and position this anywhere on the screen
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { colors, spacing } = DesignSystem;
const BUTTON_SIZE = 56;
const STORAGE_KEY = '@notification_bell_position';

interface DraggableNotificationBellProps {
  unreadCount: number;
}

export function DraggableNotificationBell({ unreadCount }: DraggableNotificationBellProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  // Default position (bottom right)
  const defaultX = SCREEN_WIDTH - BUTTON_SIZE - spacing.lg;
  const defaultY = SCREEN_HEIGHT - BUTTON_SIZE - 140;
  
  const position = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current;
  const [isLoaded, setIsLoaded] = useState(false);
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);

  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { x, y } = JSON.parse(saved);
          // Validate position is within bounds
          const validX = Math.max(spacing.sm, Math.min(x, SCREEN_WIDTH - BUTTON_SIZE - spacing.sm));
          const validY = Math.max(100, Math.min(y, SCREEN_HEIGHT - BUTTON_SIZE - 100));
          position.setValue({ x: validX, y: validY });
        }
      } catch (error) {
        console.log('[DraggableBell] Error loading position:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPosition();
  }, []);

  // Save position when dragging ends
  const savePosition = async (x: number, y: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    } catch (error) {
      console.log('[DraggableBell] Error saving position:', error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only become pan responder if there's enough movement
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        dragStartTime.current = Date.now();
        // Extract offset from current animated value
        position.extractOffset();
      },
      onPanResponderMove: (_, gesture) => {
        // Mark as dragging if moved significantly
        if (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10) {
          isDragging.current = true;
        }
        // Update position
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        position.flattenOffset();
        
        // Get current position values
        const currentX = (position.x as any)._value;
        const currentY = (position.y as any)._value;
        
        // Keep within screen bounds
        let finalX = Math.max(spacing.sm, Math.min(currentX, SCREEN_WIDTH - BUTTON_SIZE - spacing.sm));
        let finalY = Math.max(100, Math.min(currentY, SCREEN_HEIGHT - BUTTON_SIZE - 100));

        // Snap to nearest edge (left or right)
        const snapToLeft = finalX < SCREEN_WIDTH / 2;
        finalX = snapToLeft ? spacing.lg : SCREEN_WIDTH - BUTTON_SIZE - spacing.lg;

        // Animate to snapped position
        Animated.spring(position, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 6,
          tension: 50,
        }).start();

        // Save position
        savePosition(finalX, finalY);

        // Check if it was a tap (short duration, minimal movement)
        const dragDuration = Date.now() - dragStartTime.current;
        const wasTap = dragDuration < 200 && Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10;
        
        if (wasTap) {
          router.push('/(tabs)/notifications' as any);
        }
        
        // Reset dragging state after a small delay
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;

  if (!isLoaded) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.button}>
        <Ionicons name="notifications" size={24} color={colors.text.inverse} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
});

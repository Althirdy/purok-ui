/**
 * Image Viewer Component
 * 
 * Fullscreen modal for viewing images with:
 * - Pinch-to-zoom
 * - Pan gestures
 * - Swipe between multiple images
 * - Double-tap to zoom
 * - Close on swipe down or tap background
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const { colors, spacing } = DesignSystem;

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, visible, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Animation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Reset transforms when opening or changing image
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      opacity.value = 1;
    }
  }, [visible, initialIndex]);

  const resetTransforms = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const goToNextImage = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetTransforms();
    }
  }, [currentIndex, images.length, resetTransforms]);

  const goToPrevImage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetTransforms();
    }
  }, [currentIndex, resetTransforms]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // If not zoomed in, use vertical swipe to dismiss
      if (savedScale.value <= 1) {
        translateY.value = event.translationY;
        opacity.value = 1 - Math.abs(event.translationY) / 400;
        
        // Horizontal swipe for navigation
        translateX.value = event.translationX;
      } else {
        // When zoomed, allow panning
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (savedScale.value <= 1) {
        // Dismiss on vertical swipe
        if (Math.abs(event.translationY) > 150) {
          opacity.value = withTiming(0, { duration: 200 });
          translateY.value = withTiming(
            event.translationY > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT,
            { duration: 200 },
            () => {
              runOnJS(handleClose)();
            }
          );
          return;
        }
        
        // Navigate on horizontal swipe
        if (Math.abs(event.translationX) > 100 && Math.abs(event.velocityX) > 500) {
          if (event.translationX > 0) {
            runOnJS(goToPrevImage)();
          } else {
            runOnJS(goToNextImage)();
          }
        }
        
        // Reset position
        translateY.value = withSpring(0);
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      } else {
        // Save position when zoomed
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        // Reset zoom
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom to 2x at tap location
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGestures = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, animatedBackgroundStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text.inverse} />
            </Pressable>
            {images.length > 1 && (
              <Text style={styles.counter}>
                {currentIndex + 1} / {images.length}
              </Text>
            )}
            <View style={styles.headerSpacer} />
          </View>

          {/* Image */}
          <GestureDetector gesture={composedGestures}>
            <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
              <Image
                source={{ uri: images[currentIndex] }}
                style={styles.image}
                contentFit="contain"
                transition={200}
              />
            </Animated.View>
          </GestureDetector>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <Pressable style={[styles.navButton, styles.navButtonLeft]} onPress={goToPrevImage}>
                  <Ionicons name="chevron-back" size={32} color={colors.text.inverse} />
                </Pressable>
              )}
              {currentIndex < images.length - 1 && (
                <Pressable style={[styles.navButton, styles.navButtonRight]} onPress={goToNextImage}>
                  <Ionicons name="chevron-forward" size={32} color={colors.text.inverse} />
                </Pressable>
              )}
            </>
          )}

          {/* Dots indicator */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Instructions */}
          <Text style={styles.instructions}>
            Pinch to zoom • Double tap to zoom • Swipe to close
          </Text>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: spacing.md,
  },
  navButtonRight: {
    right: spacing.md,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: colors.text.inverse,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  instructions: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});

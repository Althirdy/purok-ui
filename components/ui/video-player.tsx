/**
 * Video Player Component
 * 
 * Inline video thumbnail with play button overlay for the gallery,
 * plus a fullscreen modal video player using expo-av.
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const { colors, spacing } = DesignSystem;

// ─── Video Thumbnail (for gallery) ────────────────────────────────────

interface VideoThumbnailProps {
  uri: string;
  style?: any;
  onPress?: () => void;
}

/**
 * A dark thumbnail with a play icon — tapping opens the fullscreen player.
 */
export function VideoThumbnail({ uri, style, onPress }: VideoThumbnailProps) {
  return (
    <Pressable style={[thumbStyles.container, style]} onPress={onPress}>
      <View style={thumbStyles.background}>
        <Ionicons name="videocam" size={24} color="rgba(255,255,255,0.6)" />
      </View>
      <View style={thumbStyles.playOverlay}>
        <View style={thumbStyles.playButton}>
          <Ionicons name="play" size={22} color="#fff" />
        </View>
      </View>
      <View style={thumbStyles.badge}>
        <Ionicons name="film-outline" size={10} color="#fff" />
        <Text style={thumbStyles.badgeText}>VIDEO</Text>
      </View>
    </Pressable>
  );
}

const thumbStyles = StyleSheet.create({
  container: {
    width: 140,
    height: 105,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
  },
  background: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3, // optical centering for play icon
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});


// ─── Fullscreen Video Player Modal ────────────────────────────────────

interface VideoPlayerModalProps {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ uri, visible, onClose }: VideoPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState(false);

  const handlePlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    }
    if (status.error) {
      console.error('[VideoPlayer] Playback error:', status.error);
      setError(true);
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const handleClose = useCallback(() => {
    setIsLoading(true);
    setError(false);
    setIsPlaying(true);
    onClose();
  }, [onClose]);

  if (!visible || !uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={modalStyles.container}>
        {/* Header */}
        <View style={[modalStyles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={modalStyles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={modalStyles.title}>Video</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Video */}
        <View style={modalStyles.videoContainer}>
          {error ? (
            <View style={modalStyles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={modalStyles.errorText}>Unable to play video</Text>
              <Text style={modalStyles.errorSubtext}>The video format may not be supported</Text>
            </View>
          ) : (
            <>
              <Video
                ref={videoRef}
                source={{ uri }}
                style={modalStyles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={(err) => {
                  console.error('[VideoPlayer] Load error:', err);
                  setError(true);
                  setIsLoading(false);
                }}
              />
              {isLoading && (
                <View style={modalStyles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={modalStyles.loadingText}>Loading video...</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

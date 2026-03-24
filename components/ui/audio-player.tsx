/**
 * Audio Player Component
 *
 * A self-contained inline audio player using expo-av.
 * Shows play/pause button with a progress bar and duration.
 */

import { DesignSystem } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { colors, spacing } = DesignSystem;

interface AudioPlayerProps {
  uri: string;
  /** Label above the player (default: "Audio Recording") */
  label?: string;
  /** Compact mode for related anomalies */
  compact?: boolean;
}

export function AudioPlayer({ uri, label = 'Audio Recording', compact = false }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis ?? 0);
      setDuration(status.durationMillis ?? 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        soundRef.current?.setPositionAsync(0);
      }
    }
    if (status.error) {
      console.error('[AudioPlayer] Playback error:', status.error);
      setError(true);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    try {
      if (!soundRef.current) {
        // First time — load and play
        setIsLoading(true);
        setError(false);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate,
        );
        soundRef.current = sound;
        setIsLoading(false);
      } else if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      console.error('[AudioPlayer] Error:', err);
      setError(true);
      setIsLoading(false);
    }
  }, [uri, isPlaying, onPlaybackStatusUpdate]);

  // Format ms to mm:ss
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  if (error) {
    return (
      <View style={[playerStyles.container, compact && playerStyles.containerCompact]}>
        <View style={[playerStyles.playButton, { backgroundColor: '#ef444420' }]}>
          <Ionicons name="alert-circle" size={compact ? 18 : 22} color="#ef4444" />
        </View>
        <View style={playerStyles.content}>
          <Text style={playerStyles.label}>Unable to load audio</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[playerStyles.container, compact && playerStyles.containerCompact]}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[playerStyles.playButton, isPlaying && playerStyles.playButtonActive]}
        onPress={togglePlayPause}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={compact ? 18 : 22}
            color="#fff"
            style={!isPlaying ? { marginLeft: 2 } : undefined}
          />
        )}
      </TouchableOpacity>

      {/* Info + Progress */}
      <View style={playerStyles.content}>
        <Text style={[playerStyles.label, compact && playerStyles.labelCompact]} numberOfLines={1}>
          {label}
        </Text>
        {/* Progress bar */}
        <View style={playerStyles.progressBar}>
          <View style={[playerStyles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        {duration > 0 && (
          <Text style={playerStyles.time}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        )}
      </View>
    </View>
  );
}

const playerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  containerCompact: {
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#7c3aed',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  labelCompact: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
});

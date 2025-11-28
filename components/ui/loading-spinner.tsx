import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export function LoadingSpinner() {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1f4ea8" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 999,
  },
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
});



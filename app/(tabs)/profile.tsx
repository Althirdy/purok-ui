/**
 * Profile Screen - Purok profile, styled like citizen app profile
 */

import { ProfileSkeleton } from '@/components/profile/profile-skeleton';
import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { useAuth } from '@/context/auth-context';
import { getInitials } from '@/utils/userHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors } = DesignSystem;
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';

export default function ProfileScreen() {
  const { user, logout, refreshUser, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }, [refreshUser]),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleEditProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    if (!accessToken) {
      Alert.alert('Error', 'You must be logged in to update your profile photo.');
      return;
    }

    setUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      
      // Get file extension from URI
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      // Append image to form data
      formData.append('avatar', {
        uri: imageUri,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        name: `profile_photo.${fileExtension}`,
      } as any);

      const response = await fetch(`${API_BASE}/api/v1/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Profile picture updated successfully!');
        // Refresh user data to get the new profile photo URL
        await refreshUser();
      } else {
        throw new Error(data.message || 'Failed to upload profile photo');
      }
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is needed to select a photo.');
          return;
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Upload to server
        await uploadProfilePhoto(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const profilePictureUri = user?.profilePicture;

  if (loading && !user) {
    return (
      <SafeAreaView style={globalStyles.container} edges={['top']}>
        <View style={styles.appBar}>
          <View style={styles.appBarContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.appBarTitleContainer}>
              <Text style={styles.appTitle}>Profile</Text>
            </View>
            <View style={styles.appBarPlaceholder} />
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <View style={styles.appBar}>
        <View style={styles.appBarContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.appBarTitleContainer}>
            <Text style={styles.appTitle}>Profile</Text>
          </View>
          <View style={styles.appBarPlaceholder} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleEditProfilePicture} activeOpacity={0.8} disabled={uploading}>
              {profilePictureUri ? (
                <Image source={{ uri: profilePictureUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                </View>
              )}
              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : (
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Purok Leader'}</Text>
          <Text style={styles.userRole}>Purok Leader</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.profileItem}>
            <View style={styles.profileItemHeader}>
              <Ionicons name="mail-outline" size={20} color="#1e3a8a" />
              <Text style={styles.profileItemLabel}>Email Address</Text>
            </View>
            <Text style={styles.profileItemValue}>
              {user?.email || 'No email provided'}
            </Text>
          </View>

          <View style={styles.profileItem}>
            <View style={styles.profileItemHeader}>
              <Ionicons name="call-outline" size={20} color="#1e3a8a" />
              <Text style={styles.profileItemLabel}>Phone Number</Text>
            </View>
            <Text style={styles.profileItemValue}>
              {user?.phoneNumber || 'No phone number provided'}
            </Text>
          </View>

          <View style={styles.profileItem}>
            <View style={styles.profileItemHeader}>
              <Ionicons name="location-outline" size={20} color="#1e3a8a" />
              <Text style={styles.profileItemLabel}>Purok Address</Text>
            </View>
            <Text style={styles.profileItemValue}>
              {user?.address || 'No address provided'}
            </Text>
          </View>

        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItemNoBorder}
            onPress={() =>
              Alert.alert('Help & Support', 'This option will be available in a future update.')
            }
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#1e3a8a" />
              <Text style={styles.settingItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>UrbanWatch Purok v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  appBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 58, 138, 0.7)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  profileItem: {
    marginBottom: 16,
  },
  profileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 28,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingItemNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
    width: '80%',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  versionText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});

/**
 * Profile Settings Screen - Edit user profile
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius } = DesignSystem;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isIOS = Platform.OS === 'ios';

// Inline styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  formSection: {
    gap: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 48,
  },
  updateButton: {
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  updateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
});

export default function ProfileSettingsScreen() {
  const [firstName, setFirstName] = useState('Julius');
  const [lastName, setLastName] = useState('Bailon');
  const [email, setEmail] = useState('Juliusbailon@gmail.com');
  const [phone, setPhone] = useState('+63 912 345 6789');

  const handleUpdateProfile = () => {
    Alert.alert('Profile Updated', 'Your profile has been updated successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleEditAvatar = () => {
    Alert.alert('Edit Avatar', 'Avatar editing will be implemented soon.');
  };

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Settings</Text>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleEditAvatar}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JB</Text>
              </View>
              <View style={styles.editIconButton}>
                <Ionicons name="pencil" size={16} color={colors.text.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Address</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.secondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleUpdateProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/**
 * Emergency Report Screen - Form for submitting emergency reports
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
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

// Inline styles to avoid route conflicts
const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.navy,
    paddingHorizontal: spacing.md * (isTablet ? 1.5 : 1),
    paddingBottom: spacing.sm,
    paddingTop: isIOS ? spacing.sm : spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.accent.orange}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.navy,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: spacing.md * (isTablet ? 1.5 : 1),
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'] * (isTablet ? 1.2 : 1),
  },
  title: {
    fontSize: isTablet ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  formContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent.orange,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.gray700,
    minHeight: 48,
  },
  inputText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  placeholder: {
    color: colors.text.secondary,
  },
  locationInput: {
    marginLeft: spacing.sm,
  },
  uploadInput: {
    marginLeft: spacing.sm,
  },
  textArea: {
    minHeight: isTablet ? 120 : 80,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  dropdown: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral.gray700,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray700,
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  uploadedImage: {
    width: '100%',
    height: isTablet ? 200 : 150,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.accent.orange,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default function EmergencyReportScreen() {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [evidence, setEvidence] = useState<string | null>(null);

  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);

  const incidentTypes = [
    'Fire',
    'Medical Emergency',
    'Natural Disaster',
    'Crime',
    'Accident',
    'Infrastructure Damage',
    'Other',
  ];

  const handleSubmit = () => {
    if (!incidentType || !description || !location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // TODO: Implement API call to submit report
    console.log('Submitting report:', { incidentType, description, location, evidence });
    
    Alert.alert('Report Submitted', 'Your emergency report has been sent to local authorities.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleSelectLocation = () => {
    // TODO: Implement location picker
    setLocation('Current Location'); // Placeholder
    Alert.alert('Location', 'Location picker will be implemented');
  };

  const handleUploadPhoto = () => {
    // TODO: Implement image picker
    Alert.alert('Evidence', 'Photo upload will be implemented');
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
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.logo}>
                <Ionicons name="shield" size={28} color={colors.accent.orange} />
              </View>
              <Text style={styles.logoText}>Argus</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('./profile')}
              >
                <Ionicons name="person" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Navigation Bar with Back Button */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Emergency Report</Text>

          {/* Form Container with Dotted Border */}
          <View style={styles.formContainer}>
            {/* Incident Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Incident Type*</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowIncidentDropdown(!showIncidentDropdown)}
                activeOpacity={0.7}
              >
                <Text style={[styles.inputText, !incidentType && styles.placeholder]}>
                  {incidentType || 'Select incident type'}
                </Text>
                <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
              {showIncidentDropdown && (
                <View style={styles.dropdown}>
                  {incidentTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setIncidentType(type);
                        setShowIncidentDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder=""
                placeholderTextColor={colors.text.secondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location*</Text>
              <TouchableOpacity 
                style={styles.input} 
                onPress={handleSelectLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="radio-button-on" size={24} color={colors.accent.orange} />
                <Text style={[styles.inputText, styles.locationInput, !location && styles.placeholder]}>
                  {location || 'Select location'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Evidence */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Evidence*</Text>
              <TouchableOpacity 
                style={styles.input} 
                onPress={handleUploadPhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color={colors.text.secondary} />
                <Text style={[styles.inputText, styles.uploadInput, !evidence && styles.placeholder]}>
                  {evidence ? 'Photo selected' : 'Upload photo'}
                </Text>
              </TouchableOpacity>
              {evidence && (
                <Image source={{ uri: evidence }} style={styles.uploadedImage} />
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Emergency Report</Text>
          </TouchableOpacity>

          {/* Footer Text */}
          <Text style={styles.footerText}>
            Your report will be sent to local authorities immediately.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

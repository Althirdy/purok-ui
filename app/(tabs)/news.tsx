/**
 * Safety News Screen - Public Posts/Announcements for Purok Officials
 * 
 * Displays safety updates, emergency alerts, and community announcements
 */

import { DesignSystem } from '@/constants/design-system';
import { globalStyles } from '@/constants/global-styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

// Semantic colors for easier access
const semantic = colors.semantic;

export default function NewsScreen() {
  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety News</Text>
        <Text style={styles.headerSubtitle}>Stay informed about safety updates and alerts</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* News Cards */}
        <View style={styles.newsContainer}>
          {/* Local Safety Updates */}
          <View style={[styles.newsCard, styles.newsCardBlue]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary.blue + '20' }]}>
                <Ionicons name="newspaper" size={24} color={colors.primary.blue} />
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>Latest</Text>
              </View>
            </View>
            <Text style={styles.newsTitle}>Local Safety Updates</Text>
            <Text style={styles.newsText}>
              Stay connected with the latest safety news, emergency alerts, and community updates from your barangay.
            </Text>
          </View>
          
          {/* Emergency Alerts */}
          <View style={[styles.newsCard, styles.newsCardRed]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: semantic.error + '20' }]}>
                <Ionicons name="warning" size={24} color={semantic.error} />
              </View>
              <View style={[styles.cardBadge, { backgroundColor: semantic.error + '20' }]}>
                <Text style={[styles.badgeText, { color: semantic.error }]}>Urgent</Text>
              </View>
            </View>
            <Text style={styles.newsTitle}>Emergency Alerts</Text>
            <Text style={styles.newsText}>
              Receive real-time notifications about emergencies and safety incidents in your area.
            </Text>
          </View>
          
          {/* Community Tips */}
          <View style={[styles.newsCard, styles.newsCardGreen]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: semantic.success + '20' }]}>
                <Ionicons name="people" size={24} color={semantic.success} />
              </View>
            </View>
            <Text style={styles.newsTitle}>Community Tips</Text>
            <Text style={styles.newsText}>
              Learn safety tips and best practices shared by your local community and authorities.
            </Text>
          </View>

          {/* Purok Updates */}
          <View style={[styles.newsCard, styles.newsCardPurple]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf6' + '20' }]}>
                <Ionicons name="megaphone" size={24} color="#8b5cf6" />
              </View>
            </View>
            <Text style={styles.newsTitle}>Purok Announcements</Text>
            <Text style={styles.newsText}>
              Important announcements and updates from your Purok Leader and local officials.
            </Text>
          </View>
        </View>
        
        {/* Coming Soon Placeholder */}
        <View style={styles.placeholder}>
          <Ionicons name="construct-outline" size={48} color={colors.neutral.gray400} />
          <Text style={styles.placeholderTitle}>News Feed Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Real-time news and announcements will be available here once the backend is connected.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.blue,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral.gray300,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  newsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  newsCard: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderLeftWidth: 4,
  },
  newsCardBlue: {
    borderLeftColor: colors.primary.blue,
  },
  newsCardRed: {
    borderLeftColor: '#ef4444',
  },
  newsCardGreen: {
    borderLeftColor: '#10b981',
  },
  newsCardPurple: {
    borderLeftColor: '#8b5cf6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    backgroundColor: colors.primary.blue + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.blue,
  },
  newsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  newsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  placeholder: {
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral.gray200,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

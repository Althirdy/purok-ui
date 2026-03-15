import { usePostStore } from '@/stores/postStore';
import { getCategoryColor, getCategoryIcon } from '@/utils/postHelpers';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const postId = params.id as string;

  // Get post from store (filtered from list, not fetched from API)
  const { selectedPost, getPostById } = usePostStore();
  const post = selectedPost?.id === postId ? selectedPost : getPostById(postId);

  const screenWidth = Dimensions.get('window').width;
  const imageHeight = (screenWidth - 32) * 0.6;

  const handleBack = () => {
    router.push('/(tabs)/news');
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Unable to load post</Text>
          <Text style={styles.errorText}>
            The post could not be found
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(post.category);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>News Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category and Date Badge */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColor + '15' },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(post.category)}
              size={16}
              color={categoryColor}
            />
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {post.category}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.publishedAt}>{post.publishedAt}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Publisher Info */}
        <View style={styles.publisherContainer}>
          <View style={styles.publisherAvatar}>
            <Ionicons name="business" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.publisherLabel}>Published by</Text>
            <Text style={styles.publisherName}>{post.publishedBy}</Text>
          </View>
        </View>

        {/* Media Image */}
        {post.media && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: post.media }}
              style={[styles.media, { height: imageHeight }]}
              contentFit="cover"
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.content}>{post.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  publishedAt: {
    fontSize: 13,
    color: '#94a3b8',
  },
  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 32,
    marginBottom: 16,
  },
  // Publisher
  publisherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  publisherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publisherLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  publisherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  // Media
  mediaContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  media: {
    width: '100%',
  },
  // Content
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  content: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
});

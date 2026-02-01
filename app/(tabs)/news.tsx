/**
 * Safety News Screen - Public Posts/Announcements for Purok Officials
 * 
 * Displays safety updates, emergency alerts, and community announcements
 * Integrates with backend public-posts API
 */

import { PostCard } from '@/components/news/PostCard';
import { usePublicPosts } from '@/hooks/usePublicPosts';
import { usePostStore } from '@/stores/postStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NewsScreen() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicPosts(10);

  const { setPosts } = usePostStore();

  // Flatten all pages into a single array of posts
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) || [],
    [data]
  );

  // Sync posts with store for detail page filtering
  useEffect(() => {
    if (posts.length > 0) {
      setPosts(posts);
    }
  }, [posts, setPosts]);

  // Refresh posts when screen gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('[NewsScreen] 👁️ Screen focused - refreshing posts...');
      refetch();
    }, [refetch])
  );

  // Subtle branded header
  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.headerIconContainer}>
        <Ionicons name="newspaper" size={18} color="#1e3a8a" />
      </View>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Safety News</Text>
        <Text style={styles.headerSubtitle}>Updates & alerts from your community</Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load news</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="newspaper-outline" size={48} color="#94a3b8" />
        <Text style={styles.emptyText}>No news available</Text>
        <Text style={styles.emptySubtext}>
          Check back later for updates
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#1e3a8a" />
          <Text style={styles.footerLoaderText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        estimatedItemSize={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Subtle Header Section
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  // Center Container States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Footer Loader
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#64748b',
  },
});

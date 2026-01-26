/**
 * Safety News Screen - Public Posts/Announcements for Purok Officials
 * 
 * Displays safety updates, emergency alerts, and community announcements
 * Integrates with backend public-posts API
 */

import { usePublicPosts } from '@/hooks/usePublicPosts';
import { usePostStore } from '@/stores/postStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from '@/components/news/PostCard';

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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Safety News</Text>
      <Text style={styles.subtitle}>
        Stay informed about safety updates and alerts
      </Text>
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#64748b',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
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

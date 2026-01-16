import { Card } from '@/components/ui/Card';
import { usePostStore } from '@/stores/postStore';
import { PublicPost } from '@/types/posts';
import { getCategoryColor, getCategoryIcon } from '@/utils/postHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PostCardProps {
  post: PublicPost;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const categoryColor = getCategoryColor(post.category);
  const { setSelectedPost } = usePostStore();

  const handlePress = () => {
    setSelectedPost(post);
    router.push(`/news/post-detail?id=${post.id}`);
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Card 
        variant="elevated" 
        style={{ ...styles.card, borderLeftColor: categoryColor }}
      >
        {/* Header with Category and Time */}
        <View style={styles.header}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColor + '15' },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(post.category)}
              size={14}
              color={categoryColor}
            />
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {post.category}
            </Text>
          </View>
          <Text style={styles.publishedAt}>{post.publishedAt}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {/* Content Preview */}
        <Text style={styles.content} numberOfLines={2}>
          {post.content}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.publisherInfo}>
            <Ionicons name="business-outline" size={14} color="#64748b" />
            <Text style={styles.publishedBy}>{post.publishedBy}</Text>
          </View>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>Read more</Text>
            <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  publishedAt: {
    fontSize: 12,
    color: '#94a3b8',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 22,
  },
  content: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  publisherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publishedBy: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readMoreText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

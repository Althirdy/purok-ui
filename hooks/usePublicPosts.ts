import { postsService } from '@/services/posts-service';
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * Query Keys for Posts
 */
export const postQueryKeys = {
  all: ['public-posts'] as const,
  infinite: () => [...postQueryKeys.all, 'infinite'] as const,
};

/**
 * Hook to fetch infinite scrolling public posts with cursor pagination
 */
export function usePublicPosts(perPage: number = 10) {
  return useInfiniteQuery({
    queryKey: postQueryKeys.infinite(),
    queryFn: ({ pageParam }) => postsService.getAllWithCursor(pageParam, perPage),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    getPreviousPageParam: (firstPage) => firstPage.prev_cursor ?? undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Posts Service
 * Handles all API operations for public posts
 */
import { httpGet } from '@/lib/axios';
import { PublicPost, PublicPostsResponse } from '@/types/posts';

/**
 * Cursor Paginated Response for Public Posts
 */
export interface CursorPaginatedPostsResponse {
  posts: PublicPost[];
  next_cursor: string | null;
  prev_cursor: string | null;
}

/**
 * API Error Type
 */
export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Parse API errors into a standardized format
 */
function parseError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
    };
  }
  return {
    message: 'An unexpected error occurred',
  };
}

/**
 * Get all public posts with cursor pagination
 */
export async function getAllPostsWithCursor(
  cursor: string | null = null,
  perPage: number = 10
): Promise<CursorPaginatedPostsResponse> {
  try {
    const params = new URLSearchParams();
    params.set('per_page', String(perPage));
    if (cursor) {
      params.set('cursor', cursor);
    }

    const url = `/api/v1/mobile/public-posts?${params.toString()}`;
    const response = await httpGet<PublicPostsResponse>(url);

    return {
      posts: response.data || [],
      next_cursor: response.pagination?.next_cursor ?? null,
      prev_cursor: response.pagination?.prev_cursor ?? null,
    };
  } catch (error) {
    console.error('[PostsService] Error fetching posts:', error);
    throw parseError(error);
  }
}

/**
 * Posts Service class (alternative interface)
 */
class PostsService {
  private readonly baseEndpoint = '/api/v1/mobile/public-posts';

  async getAllWithCursor(
    cursor: string | null = null,
    perPage: number = 10
  ): Promise<CursorPaginatedPostsResponse> {
    return getAllPostsWithCursor(cursor, perPage);
  }
}

export const postsService = new PostsService();

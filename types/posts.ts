/**
 * Public Post Types
 */
export type PostCategory = 'General' | 'News' | 'Alert' | 'Event' | 'Maintenance';

export interface PublicPost {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  publishedBy: string;
  media: string | null;
  category: PostCategory;
}

export interface PublicPostsPagination {
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface PublicPostsResponse {
  status: string;
  message: string;
  data: PublicPost[];
  pagination: PublicPostsPagination;
}

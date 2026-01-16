import { PublicPost } from '@/types/posts';
import { create } from 'zustand';

interface PostStore {
  posts: PublicPost[];
  selectedPost: PublicPost | null;
  setPosts: (posts: PublicPost[]) => void;
  setSelectedPost: (post: PublicPost | null) => void;
  getPostById: (id: string) => PublicPost | undefined;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  selectedPost: null,
  setPosts: (posts) => set({ posts }),
  setSelectedPost: (post) => set({ selectedPost: post }),
  getPostById: (id) => get().posts.find((post) => post.id === id),
}));

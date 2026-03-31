export enum FeedItemType {
  FORUM = 'FORUM',
  POLICY_TYPE = 'POLICY_TYPE',
  DEBATE = 'DEBATE',
  UPDATE = 'UPDATE',
  NEWS = 'NEWS',
  BLOG = 'BLOG',
  VIDEO = 'VIDEO',
  PROMO = 'PROMO'
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  subtitle?: string | null;
  authorName?: string | null;
  authorImage?: string | null;
  authorId?: string | null;
  thumbnail?: string | null;
  timestamp?: string | null;
  votes?: number | null;
  upvoteCount?: number;
  downvoteCount?: number;
  comments?: number | null;
  viewCount?: number;
  category?: string | null;
  excerpt?: string | null;
  videoDuration?: string | null;
  videoUrl?: string | null;
  content?: string | null;
  quote?: string | null;
  isTrending?: boolean;
}

// Retrofit API Interfaces ported to TypeScript
export interface AuthResponse {
  access_token: string;
  user: UserProfileResponse;
}

export interface UserProfileResponse {
  id?: string | null;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt?: string | null;
}

export interface PaginatedNotificationsResponse {
  data: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationResponse {
  id: string;
  type: string;
  payload?: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedPostsResponse {
  data: PostResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface PostResponse {
  id: string;
  title: string;
  body?: string | null;
  type: string; // 'blog', 'news', 'video'
  media_url?: string | null;
  author_id: string;
  community_id: string;
  vote_count: number;
  hot_score: number;
  created_at: string;
  updated_at: string;
  author?: UserResponse | null;
  community?: CommunityResponse | null;
}

export interface UserResponse {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface CommunityResponse {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
}

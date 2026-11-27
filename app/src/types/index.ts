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
  short_description?: string | null;
  authorName?: string | null;
  authorImage?: string | null;
  authorId?: string | null;
  authorUsername?: string | null;
  authorNameCustom?: string | null;
  authorPosition?: string | null;
  author_name?: string | null;
  author_position?: string | null;
  hashtags?: string[] | null;
  thumbnail?: string | null;
  featured_image_alt?: string | null;
  featured_image_caption?: string | null;
  featured_image_credit?: string | null;
  timestamp?: string | null;
  published_at?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
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
  content_json?: any;
  quote?: string | null;
  language?: 'en' | 'ta';
  slug?: string | null;
  translation_group_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  robots_index?: boolean;
  isTrending?: boolean;
  is_breaking?: boolean;
  is_featured?: boolean;
  is_editors_pick?: boolean;
  reading_time_minutes?: number;
  ads_enabled?: boolean;
  ad_breaks?: { type: string; time: number }[] | null;
  translations?: Array<{ id: string; title: string; language: 'en' | 'ta'; slug: string }>;
  author?: {
    id: string;
    username: string;
    channel_name?: string | null;
    avatarUrl?: string | null;
  } | null;
}

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
  type: string;
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

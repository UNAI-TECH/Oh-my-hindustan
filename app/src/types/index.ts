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
  thumbnail?: string | null;
  timestamp?: string | null;
  votes?: string | null;
  comments?: number | null;
  category?: string | null;
  excerpt?: string | null;
  videoDuration?: string | null;
  content?: string | null;
  quote?: string | null;
  isTrending?: boolean;
}

export const SampleData = {
  topNarratives: [
    {
      id: "tn1",
      type: FeedItemType.POLICY_TYPE,
      title: "BJP outlines vision for Viksit Bharat by 2047",
      category: "Policy",
      thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "tn2",
      type: FeedItemType.UPDATE,
      title: "Digital India Revolution: Bridging the Rural-Urban Divide",
      category: "Digital India",
      thumbnail: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800"
    }
  ] as FeedItem[],
  
  baseFeedItems: [
    // Politics
    { id: "p1", type: FeedItemType.FORUM, title: "Supreme Court delivers landmark verdict on electoral bonds, mandates immediate disclosure", category: "Politics", timestamp: "2h ago", votes: "24.5k", comments: 3204, thumbnail: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", authorName: "The Hindu Analysis" },
    { id: "p2", type: FeedItemType.DEBATE, title: "Ground Report: Coimbatore Elections 2024 - Public Opinion & Real Issues", category: "Politics", timestamp: "1 day ago", votes: "89.4k", comments: 5820, thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800", videoDuration: "18:45", authorName: "Polimer News" },
    { id: "p3", type: FeedItemType.UPDATE, title: "New alliances form ahead of state assembly elections", category: "Politics", timestamp: "30m ago", votes: "12k", comments: 400, thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800", authorName: "Political Daily" },
    
    // Policy
    { id: "pol1", type: FeedItemType.POLICY_TYPE, title: "New Education Policy Implementation Guidelines Released", category: "Policy", timestamp: "5h ago", votes: "12k", comments: 890, thumbnail: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800", authorName: "Policy Watch" },
    { id: "pol2", type: FeedItemType.FORUM, title: "Discussing the implications of the new labour codes", category: "Policy", timestamp: "12h ago", votes: "5.6k", comments: 450, thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800", authorName: "Labor Union" },
    { id: "pol3", type: FeedItemType.DEBATE, title: "Tax Reforms: Are they favoring the middle class?", category: "Policy", timestamp: "2 hrs ago", votes: "45k", comments: 1200, thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800", videoDuration: "22:10", authorName: "Economic Forum" },

    // Economy
    { id: "e1", type: FeedItemType.POLICY_TYPE, title: "How ONDC is breaking the e-commerce monopoly in India", category: "Economy", timestamp: "3h ago", votes: "12.8k", comments: 450, thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800", authorName: "Tech Policy India" },
    { id: "e2", type: FeedItemType.UPDATE, title: "Sensex hits new all-time high amidst positive global cues", category: "Economy", timestamp: "30m ago", votes: "45k", comments: 1205, thumbnail: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800", authorName: "Market Today" },
    { id: "e3", type: FeedItemType.FORUM, title: "Inflation impacts: Real estate prices skyrocket in Metro cities", category: "Economy", timestamp: "4h ago", votes: "9.5k", comments: 1500, thumbnail: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName: "Housing Insight" },

    // Digital India
    { id: "d1", type: FeedItemType.UPDATE, title: "UPI transactions cross 10 billion mark in a single month", category: "Digital India", timestamp: "1h ago", votes: "34k", comments: 2100, thumbnail: "https://images.unsplash.com/photo-1622397430155-22b67f082e0e?auto=format&fit=crop&q=80&w=800", authorName: "Tech News" },
    { id: "d2", type: FeedItemType.DEBATE, title: "Data Privacy vs Innovation in Digital India", category: "Digital India", timestamp: "2 days ago", votes: "15k", comments: 3400, thumbnail: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", videoDuration: "45:00", authorName: "Tech Debate" },
    { id: "d3", type: FeedItemType.POLICY_TYPE, title: "New cyber laws aimed at securing digital identities", category: "Digital India", timestamp: "10h ago", votes: "11k", comments: 600, thumbnail: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName: "InfoSec India" },

    // Viksit Bharat
    { id: "v1", type: FeedItemType.FORUM, title: "Infrastructure push: 100 new airports planned under UDAN scheme", category: "Viksit Bharat", timestamp: "4h ago", votes: "22k", comments: 1500, thumbnail: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName: "Infra News" },
    { id: "v2", type: FeedItemType.POLICY_TYPE, title: "Green Energy transition roadmap for 2070 net-zero target", category: "Viksit Bharat", timestamp: "1 day ago", votes: "18k", comments: 900, thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", authorName: "Green Mobility India" },
    { id: "v3", type: FeedItemType.UPDATE, title: "Government launches skilled workforce initiative for manufacturing", category: "Viksit Bharat", timestamp: "5h ago", votes: "55k", comments: 2200, thumbnail: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", authorName: "National Progress" }
  ] as FeedItem[],
};

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
  type: string; // 'text', 'link', 'image', 'video'
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

import { ApiClient } from './client';
import { 
  AuthResponse, 
  UserProfileResponse, 
  PaginatedPostsResponse, 
  PostResponse, 
  PaginatedNotificationsResponse 
} from '../types';

export const AuthApi = {
  login: async (credentials: Record<string, string>) => {
    const response = await ApiClient.post<AuthResponse>('auth/login', credentials);
    return response.data;
  },

  register: async (details: Record<string, string>) => {
    const response = await ApiClient.post<AuthResponse>('auth/register', details);
    return response.data;
  },

  getProfile: async () => {
    const response = await ApiClient.get<UserProfileResponse>('auth/me');
    return response.data;
  },

  updateProfile: async (details: Record<string, string>) => {
    const response = await ApiClient.put<UserProfileResponse>('users/me', details);
    return response.data;
  }
};

export const AppApi = {
  getHomeFeed: async (page = 1, limit = 20, userId?: string | null) => {
    const params: Record<string, any> = { page, limit };
    if (userId) params.userId = userId;
    const response = await ApiClient.get<PaginatedPostsResponse>('posts', { params });
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await ApiClient.get<PostResponse>(`posts/${id}`);
    return response.data;
  },

  getCommunityPosts: async (slug: string, page = 1, limit = 20, sort = 'hot') => {
    const response = await ApiClient.get<PaginatedPostsResponse>(`r/${slug}/posts`, {
      params: { page, limit, sort }
    });
    return response.data;
  },

  getNotifications: async (page = 1, limit = 20) => {
    const response = await ApiClient.get<PaginatedNotificationsResponse>('users/me/notifications', {
      params: { page, limit }
    });
    return response.data;
  }
};

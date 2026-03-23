import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface PostData {
  title: string;
  subtitle?: string;
  content: string;
  type: 'BLOG' | 'VIDEO' | 'NEWS' | 'UPDATE';
  category?: string;
  thumbnail?: string;
  videoDuration?: string;
}

export const contentService = {
  async createPost(postData: PostData, token: string) {
    try {
      const response = await axios.post(`${API_URL}/posts`, postData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async getMyPosts(token: string) {
    try {
      const response = await axios.get(`${API_URL}/posts/my-content`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  }
};

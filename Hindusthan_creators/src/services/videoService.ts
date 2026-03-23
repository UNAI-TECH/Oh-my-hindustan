import { supabase } from '../lib/supabaseClient';

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration: string;
  views: string;
  comments_count: number;
  likes_percentage: number;
  likes_count: string;
  visibility: 'Public' | 'Private' | 'Unlisted';
  published_at: string;
  category: string;
}

export const videoService = {
  async getRecentVideos(limit = 10) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return data as Video[];
  },

  async getVideoAnalytics(videoId: string) {
    const { data, error } = await supabase
      .from('video_analytics')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      console.error('Error fetching video analytics:', error);
      return null;
    }

    return data;
  }
};

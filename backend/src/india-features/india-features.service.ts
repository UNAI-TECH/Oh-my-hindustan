import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export const SUPPORTED_LANGUAGES = [
  'hi', // Hindi
  'en', // English
  'ta', // Tamil
  'te', // Telugu
  'ml', // Malayalam
  'kn', // Kannada
  'bn', // Bengali
  'mr', // Marathi
  'gu', // Gujarati
  'pa', // Punjabi
  'or', // Odia
  'as', // Assamese
  'ur', // Urdu
];

@Injectable()
export class IndiaFeaturesService {
  constructor(private dataSource: DataSource) {}

  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  validateLanguage(lang: string): boolean {
    return SUPPORTED_LANGUAGES.includes(lang);
  }

  /**
   * Trending feed: geo-weighted hot algorithm stub.
   * In production, uses MaxMind GeoLite2 IP lookup to detect user's state,
   * and boosts posts from communities associated with that state.
   * For now, a simple hot-score ordered feed with optional lang filter.
   */
  async getTrendingFeed(lang?: string, page: number = 1, limit: number = 20) {
    let query = `
      SELECT p.id, p.title, p.body, p.vote_count, p.hot_score, p.lang, p.created_at,
             c.name AS community_name, c.slug AS community_slug
      FROM posts p
      LEFT JOIN communities c ON p.community_id = c.id
    `;
    const params: any[] = [];
    
    if (lang) {
      query += ` WHERE p.lang = $1`;
      params.push(lang);
    }
    
    query += ` ORDER BY p.hot_score DESC, p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (page - 1) * limit);

    const posts = await this.dataSource.query(query, params);
    return { data: posts, page, limit };
  }
}

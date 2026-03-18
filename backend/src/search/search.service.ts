import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(private dataSource: DataSource) {}

  /**
   * Basic PostgreSQL ILIKE search as a fallback until Elasticsearch is deployed.
   * When ES is available, this will be replaced with index queries + Hindi ICU analyzer.
   */
  async search(query: string, type?: string, page: number = 1, limit: number = 20) {
    const results: any = {};
    const q = `%${query}%`;

    if (!type || type === 'post') {
      const [posts, postCount] = await this.dataSource.query(
        `SELECT id, title, body, vote_count, created_at FROM posts WHERE title ILIKE $1 OR body ILIKE $1 ORDER BY vote_count DESC LIMIT $2 OFFSET $3`,
        [q, limit, (page - 1) * limit]
      );
      results.posts = { data: posts || [], total: postCount || 0 };
    }

    if (!type || type === 'community') {
      const communities = await this.dataSource.query(
        `SELECT id, name, slug, description FROM communities WHERE name ILIKE $1 OR description ILIKE $1 LIMIT $2 OFFSET $3`,
        [q, limit, (page - 1) * limit]
      );
      results.communities = communities || [];
    }

    if (!type || type === 'user') {
      const users = await this.dataSource.query(
        `SELECT id, username, bio, avatar_url FROM users WHERE username ILIKE $1 OR bio ILIKE $1 LIMIT $2 OFFSET $3`,
        [q, limit, (page - 1) * limit]
      );
      results.users = users || [];
    }

    return results;
  }
}

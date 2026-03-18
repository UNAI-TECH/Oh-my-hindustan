import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './entities/user.entity';
import { Community } from './entities/community.entity';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Vote } from './entities/vote.entity';
import { CommunityMember } from './entities/community-member.entity';

config(); // Load .env file

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [User, Community, Post, Comment, Vote, CommunityMember],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});

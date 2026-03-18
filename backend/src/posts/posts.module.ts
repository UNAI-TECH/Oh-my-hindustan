import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController, CommunityPostsController } from './posts.controller';
import { Post } from '../database/entities/post.entity';
import { SavedPost } from '../database/entities/saved-post.entity';
import { Community } from '../database/entities/community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, SavedPost, Community])],
  controllers: [PostsController, CommunityPostsController],
  providers: [PostsService],
  exports: [PostsService], // Exported to be used by CommunitiesModule if needed
})
export class PostsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { HotScoreProcessor } from './hot-score.processor';
import { Vote } from '../database/entities/vote.entity';
import { Post } from '../database/entities/post.entity';
import { Comment } from '../database/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Post, Comment]),
    BullModule.registerQueue({
      name: 'hot_score',
    }),
  ],
  controllers: [VotesController],
  providers: [VotesService, HotScoreProcessor],
})
export class VotesModule {}

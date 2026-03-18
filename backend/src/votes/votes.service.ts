import { Injectable, BadRequestException, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Vote, TargetType } from '../database/entities/vote.entity';
import { Post } from '../database/entities/post.entity';
import { Comment } from '../database/entities/comment.entity';
import { Redis } from 'ioredis';

@Injectable()
export class VotesService implements OnModuleInit {
  private redis: Redis;

  constructor(
    @InjectRepository(Vote) private votesRepository: Repository<Vote>,
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @InjectRepository(Comment) private commentsRepository: Repository<Comment>,
    @InjectQueue('hot_score') private hotScoreQueue: Queue,
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleInit() {
    await this.hotScoreQueue.add('recalculate', {}, {
      repeat: { pattern: '*/30 * * * *' }
    });
  }

  async handleVote(userId: string, targetId: string, targetType: TargetType, value: number) {
    if (![1, 0, -1].includes(value)) throw new BadRequestException('Invalid vote value');

    // Rate limiter: max 1 vote per 1 second per user
    const rateLimitKey = `rate-limit:vote:${userId}`;
    const isAllowed = await this.redis.setnx(rateLimitKey, '1');
    if (!isAllowed) {
      throw new HttpException('Too many requests. Please wait.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.redis.expire(rateLimitKey, 1);

    const existingVote = await this.votesRepository.findOne({ where: { userId, targetId, targetType } });
    const diff = existingVote ? value - existingVote.value : value;

    if (diff === 0) return { message: 'Vote unchanged' };

    if (value === 0 && existingVote) {
      await this.votesRepository.delete(existingVote.id);
    } else if (existingVote) {
      existingVote.value = value;
      await this.votesRepository.save(existingVote);
    } else {
      const newVote = new Vote();
      Object.assign(newVote, { userId, targetId, targetType, value });
      await this.votesRepository.save(newVote);
    }

    if (targetType === TargetType.POST) {
      await this.postsRepository.increment({ id: targetId }, 'voteCount', diff);
    } else {
      await this.commentsRepository.increment({ id: targetId }, 'voteCount', diff);
    }

    return { message: 'Vote recorded', diff, value };
  }
}


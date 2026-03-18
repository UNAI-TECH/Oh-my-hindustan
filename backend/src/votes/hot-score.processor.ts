import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../database/entities/post.entity';
import { Job } from 'bullmq';

@Processor('hot_score')
export class HotScoreProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    // Basic Reddit-style Hot Algorithm Mock:
    // score = log10(max(|votes|, 1)) + (timestamp / 45000)
    // For simplicity, we just execute a raw PostgreSQL update
    await this.postsRepository.query(`
      UPDATE posts 
      SET hot_score = LOG(GREATEST(ABS(vote_count), 1)) + (EXTRACT(EPOCH FROM created_at) / 45000)
    `);
    
    return { success: true };
  }
}

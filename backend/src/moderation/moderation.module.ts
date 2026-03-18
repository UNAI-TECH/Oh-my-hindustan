import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { Report } from '../database/entities/report.entity';
import { CommunityMember } from '../database/entities/community-member.entity';
import { Community } from '../database/entities/community.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, CommunityMember, Community])],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { Community } from '../database/entities/community.entity';
import { CommunityMember } from '../database/entities/community-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Community, CommunityMember])],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
})
export class CommunitiesModule {}

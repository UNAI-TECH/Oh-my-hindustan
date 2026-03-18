import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../database/entities/community.entity';
import { CommunityMember, CommunityRole } from '../database/entities/community-member.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private communitiesRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private membersRepository: Repository<CommunityMember>,
  ) {}

  async create(userId: string, data: any) {
    // Basic slug generation if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.communitiesRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Community with this slug already exists');
    }

    const communityData = {
      ...data,
      slug,
      creatorId: userId,
    };
    const community = new Community();
    Object.assign(community, communityData);
    
    await this.communitiesRepository.save(community);

    // Make creator an admin
    await this.membersRepository.save({
      userId,
      communityId: community.id,
      role: CommunityRole.ADMIN,
    });

    return community;
  }

  async findOneBySlug(slug: string) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');
    
    const memberCount = await this.membersRepository.count({ where: { communityId: community.id } });
    return { ...community, memberCount };
  }

  async update(slug: string, userId: string, updateData: any) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const member = await this.membersRepository.findOne({ where: { communityId: community.id, userId } });
    if (!member || (member.role !== CommunityRole.ADMIN && member.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Not authorized to update community');
    }

    await this.communitiesRepository.update(community.id, updateData);
    return this.findOneBySlug(slug);
  }

  async joinCommunity(userId: string, slug: string) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const existingMember = await this.membersRepository.findOne({ where: { communityId: community.id, userId } });
    if (existingMember) return { message: 'Already a member' };

    await this.membersRepository.save({
      userId,
      communityId: community.id,
      role: CommunityRole.MEMBER,
    });

    return { message: 'Joined successfully' };
  }

  async leaveCommunity(userId: string, slug: string) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const existingMember = await this.membersRepository.findOne({ where: { communityId: community.id, userId } });
    if (!existingMember) return { message: 'Not a member' };

    if (existingMember.role === CommunityRole.ADMIN) {
      throw new ForbiddenException('Admin cannot leave, must transfer ownership first');
    }

    await this.membersRepository.delete({ communityId: community.id, userId });
    return { message: 'Left successfully' };
  }

  async getMembers(slug: string, page: number = 1, limit: number = 20) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const [members, total] = await this.membersRepository.findAndCount({
      where: { communityId: community.id },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return { data: members, total, page, limit };
  }

  async getModerators(slug: string) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    return this.membersRepository.find({
      where: [
        { communityId: community.id, role: CommunityRole.ADMIN },
        { communityId: community.id, role: CommunityRole.MODERATOR },
      ],
      relations: ['user'],
    });
  }
}


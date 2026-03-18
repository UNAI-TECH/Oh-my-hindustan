import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportTargetType } from '../database/entities/report.entity';
import { CommunityMember, CommunityRole } from '../database/entities/community-member.entity';
import { Community } from '../database/entities/community.entity';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Report) private reportsRepository: Repository<Report>,
    @InjectRepository(CommunityMember) private membersRepository: Repository<CommunityMember>,
    @InjectRepository(Community) private communitiesRepository: Repository<Community>,
  ) {}

  async createReport(reporterId: string, targetId: string, targetType: ReportTargetType, reason: string) {
    const report = new Report();
    Object.assign(report, { reporterId, targetId, targetType, reason });
    return this.reportsRepository.save(report);
  }

  async getCommunityReports(slug: string, userId: string, page: number = 1, limit: number = 20) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const member = await this.membersRepository.findOne({ where: { communityId: community.id, userId } });
    if (!member || (member.role !== CommunityRole.ADMIN && member.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Not authorized');
    }

    const [reports, total] = await this.reportsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: reports, total, page, limit };
  }

  async updateReport(reportId: string, status: ReportStatus) {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = status;
    return this.reportsRepository.save(report);
  }

  async banUser(slug: string, modUserId: string, targetUserId: string) {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const mod = await this.membersRepository.findOne({ where: { communityId: community.id, userId: modUserId } });
    if (!mod || (mod.role !== CommunityRole.ADMIN && mod.role !== CommunityRole.MODERATOR)) {
      throw new ForbiddenException('Not authorized');
    }

    await this.membersRepository.delete({ communityId: community.id, userId: targetUserId });
    return { message: `User ${targetUserId} banned from ${slug}` };
  }
}

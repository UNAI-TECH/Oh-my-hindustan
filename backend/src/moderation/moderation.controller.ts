import { Controller, Post, Get, Put, Param, Body, Query, UseGuards, Delete } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReportTargetType, ReportStatus } from '../database/entities/report.entity';

@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  async createReport(
    @CurrentUser() user: any,
    @Body('targetId') targetId: string,
    @Body('targetType') targetType: ReportTargetType,
    @Body('reason') reason: string,
  ) {
    return this.moderationService.createReport(user.sub, targetId, targetType, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('r/:slug/reports')
  async getCommunityReports(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.moderationService.getCommunityReports(slug, user.sub, parseInt(page, 10), parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Put('reports/:id')
  async updateReport(@Param('id') id: string, @Body('status') status: ReportStatus) {
    return this.moderationService.updateReport(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('r/:slug/ban')
  async banUser(@Param('slug') slug: string, @CurrentUser() user: any, @Body('userId') targetUserId: string) {
    return this.moderationService.banUser(slug, user.sub, targetUserId);
  }
}

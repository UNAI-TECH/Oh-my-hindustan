import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('r')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCommunity(@CurrentUser() user: any, @Body() data: any) {
    return this.communitiesService.create(user.sub, data);
  }

  @Get(':slug')
  async getCommunity(@Param('slug') slug: string) {
    return this.communitiesService.findOneBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':slug')
  async updateCommunity(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    const safeData = {
      description: data.description,
      bannerUrl: data.bannerUrl,
      iconUrl: data.iconUrl,
      isNsfw: data.isNsfw,
    };
    Object.keys(safeData).forEach((key) => safeData[key as keyof typeof safeData] === undefined && delete safeData[key as keyof typeof safeData]);
    return this.communitiesService.update(slug, user.sub, safeData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/join')
  async joinCommunity(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.communitiesService.joinCommunity(user.sub, slug);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug/leave')
  async leaveCommunity(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.communitiesService.leaveCommunity(user.sub, slug);
  }

  @Get(':slug/members')
  async getMembers(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.communitiesService.getMembers(slug, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get(':slug/moderators')
  async getModerators(@Param('slug') slug: string) {
    return this.communitiesService.getModerators(slug);
  }
}


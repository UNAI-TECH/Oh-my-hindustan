import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@CurrentUser() user: any, @Body() data: any) {
    return this.postsService.create(user.sub, data);
  }

  @Get()
  async getHomeFeed(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('userId') userId?: string, // optional for authenticated users
  ) {
    return this.postsService.getHomeFeed(userId || null, parseInt(page, 10), parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved')
  async getSavedPosts(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.postsService.getSavedPosts(user.sub, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updatePost(@Param('id') id: string, @CurrentUser() user: any, @Body() data: any) {
    const safeData = { title: data.title, body: data.body };
    Object.keys(safeData).forEach((key) => safeData[key as keyof typeof safeData] === undefined && delete safeData[key as keyof typeof safeData]);
    return this.postsService.update(id, user.sub, safeData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.delete(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async savePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.savePost(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async unsavePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.unsavePost(user.sub, id);
  }
}

@Controller('r')
export class CommunityPostsController {
  constructor(private readonly postsService: PostsService) {}
  
  @Get(':slug/posts')
  async getCommunityPosts(
    @Param('slug') slug: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'hot',
  ) {
    return this.postsService.getCommunityFeed(slug, parseInt(page, 10), parseInt(limit, 10), sort);
  }
}


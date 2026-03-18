import { Controller, Get, Put, Param, Body, UseGuards, Query, UploadedFile, UseInterceptors, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    return this.usersService.getUserProfile(username);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(@CurrentUser() user: any, @Body() updateData: any) {
    // allowed fields
    const safeData = {
      username: updateData.username,
      bio: updateData.bio,
      avatarUrl: updateData.avatarUrl,
    };
    // remove undefined
    Object.keys(safeData).forEach((key) => safeData[key as keyof typeof safeData] === undefined && delete safeData[key as keyof typeof safeData]);
    
    const updatedUser = await this.usersService.updateProfile(user.sub, safeData);
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  }

  @Get(':username/posts')
  async getUserPosts(
    @Param('username') username: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.usersService.getUserPosts(username, parseInt(page, 10), parseInt(limit, 10));
  }

  @Get(':username/comments')
  async getUserComments(
    @Param('username') username: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.usersService.getUserComments(username, parseInt(page, 10), parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar-upload-url')
  async getAvatarUploadUrl(@CurrentUser() user: any) {
    // This is a stub for generating a pre-signed S3/R2 URL.
    // In Phase 16, we will integrate AWS S3 / Cloudflare R2 here.
    return {
      uploadUrl: `https://mock-s3-bucket.s3.amazonaws.com/avatars/${user.sub}?AWSAccessKeyId=mock&Expires=123456&Signature=mock`,
      fileUrl: `https://mock-cdn.example.com/avatars/${user.sub}`,
    };
  }
}


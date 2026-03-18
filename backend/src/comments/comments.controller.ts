import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @CurrentUser() user: any,
    @Body('body') body: string,
  ) {
    return this.commentsService.createTopLevel(user.sub, postId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/reply')
  async replyToComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('body') body: string,
  ) {
    return this.commentsService.createReply(user.sub, id, body);
  }

  @Get('posts/:postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('sort') sort: string = 'best',
  ) {
    return this.commentsService.getPostComments(postId, parseInt(page, 10), parseInt(limit, 10), sort);
  }

  @UseGuards(JwtAuthGuard)
  @Put('comments/:id')
  async updateComment(@Param('id') id: string, @CurrentUser() user: any, @Body('body') body: string) {
    return this.commentsService.update(id, user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.delete(id, user.sub);
  }
}

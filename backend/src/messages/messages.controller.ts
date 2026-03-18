import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getThread(
    @CurrentUser() user: any,
    @Param('userId') partnerId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.messagesService.getThread(user.sub, partnerId, parseInt(page, 10), parseInt(limit, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('userId') receiverId: string,
    @Body('body') body: string,
  ) {
    return this.messagesService.sendMessage(user.sub, receiverId, body);
  }
}

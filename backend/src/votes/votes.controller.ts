import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TargetType } from '../database/entities/vote.entity';

@Controller()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/vote')
  async votePost(@Param('id') id: string, @CurrentUser() user: any, @Body('value') value: number) {
    return this.votesService.handleVote(user.sub, id, TargetType.POST, Number(value));
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/vote')
  async voteComment(@Param('id') id: string, @CurrentUser() user: any, @Body('value') value: number) {
    return this.votesService.handleVote(user.sub, id, TargetType.COMMENT, Number(value));
  }
}


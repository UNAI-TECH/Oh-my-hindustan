import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async getUploadUrl(@CurrentUser() user: any, @Body('fileType') fileType: string) {
    return this.mediaService.generateUploadUrl(user.sub, fileType || 'jpg');
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteMedia(@Body('key') key: string) {
    return this.mediaService.deleteMedia(key);
  }
}

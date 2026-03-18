import { Controller, Get, Query } from '@nestjs/common';
import { IndiaFeaturesService } from './india-features.service';

@Controller('india')
export class IndiaFeaturesController {
  constructor(private readonly indiaFeaturesService: IndiaFeaturesService) {}

  @Get('languages')
  getSupportedLanguages() {
    return this.indiaFeaturesService.getSupportedLanguages();
  }

  @Get('trending')
  async getTrending(
    @Query('lang') lang?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.indiaFeaturesService.getTrendingFeed(lang, parseInt(page, 10), parseInt(limit, 10));
  }
}

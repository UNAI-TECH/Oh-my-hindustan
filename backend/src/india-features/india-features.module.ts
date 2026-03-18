import { Module } from '@nestjs/common';
import { IndiaFeaturesService } from './india-features.service';
import { IndiaFeaturesController } from './india-features.controller';

@Module({
  controllers: [IndiaFeaturesController],
  providers: [IndiaFeaturesService],
})
export class IndiaFeaturesModule {}

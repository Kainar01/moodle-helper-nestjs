import { Module } from '@nestjs/common';

import { DriverService, MoodleService } from './services';

@Module({
  imports: [
  ],
  providers: [DriverService, MoodleService],
  exports: [DriverService, MoodleService],
})
export class WebScraperModule {}

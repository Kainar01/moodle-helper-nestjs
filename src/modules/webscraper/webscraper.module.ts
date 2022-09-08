import { Module } from '@nestjs/common';

import { DriverService } from './services/driver.service';
import { MoodleService } from './services/moodle.service';

@Module({
  imports: [
  ],
  providers: [DriverService, MoodleService],
  exports: [DriverService, MoodleService],
})
export class WebScraperModule {}

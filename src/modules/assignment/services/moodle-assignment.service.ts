import { Injectable } from '@nestjs/common';
import type { WebDriver } from 'selenium-webdriver';

import type { Chat } from '@/modules/chat/chat.interface';
import { DriverService } from '@/modules/webscraper/services/driver.service';
import { MoodleService } from '@/modules/webscraper/services/moodle.service';

import type { MoodleAssignmentListRO } from '../interfaces/moodle-assignment.interface';

@Injectable()
export class MoodleAssignmentService {
  constructor(private driverService: DriverService, private moodle: MoodleService) {}

  public async isValidCreds(username: string, password: string) {
    return this.driverService.withDriver(async (driver: WebDriver) => this.moodle.checkLogin(username, password, driver));
  }

  public async getAssignments({ moodleUsername, moodlePassword }: Chat): Promise<MoodleAssignmentListRO> {
    return this.driverService.withDriver(async (driver: WebDriver) => (
      this.moodle.getUpcomingEvents(moodleUsername!, moodlePassword!, driver)
    ));
  }
}

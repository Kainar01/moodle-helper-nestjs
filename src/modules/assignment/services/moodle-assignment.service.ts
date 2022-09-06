import { Injectable } from '@nestjs/common';
import type { WebDriver } from 'selenium-webdriver';

import type { User } from '@/modules/user';
import { DriverService, MoodleService } from '@/modules/webscraper';

import type { MoodleAssignmentListRO } from '../interfaces';

@Injectable()
export class MoodleAssignmentService {
  constructor(private driverService: DriverService, private moodle: MoodleService) {}

  public async isValidCreds(username: string, password: string) {
    return this.driverService.withDriver(async (driver: WebDriver) => this.moodle.checkLogin(username, password, driver));
  }

  public async getAssignments({ moodleUsername, moodlePassword }: User): Promise<MoodleAssignmentListRO> {
    return this.driverService.withDriver(async (driver: WebDriver) => (
      this.moodle.getUpcomingEvents(moodleUsername!, moodlePassword!, driver)
    ));
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import type { EntityManager, Repository } from 'typeorm';

import { ScheduledUser, ScheduleHour, UserScheduleEntity, UserScheduleService } from '@/modules/user';

import { ASSIGNMENT_QUEUES } from '../assignment.constants';
import type { ShowAssignmentJobData } from '../interfaces';

@Injectable()
export class ScheduleAssignmentCron {
  constructor(
    private userScheduleService: UserScheduleService,
    @InjectQueue(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS) private showAssignmentQueue: Queue<ShowAssignmentJobData>,
    @InjectRepository(UserScheduleEntity) private userScheduleRepository: Repository<UserScheduleEntity>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async scheduleShowAssignmentJobs() {
    const currentTimeHour = moment().hour();
    const scheduledUsers = await this.userScheduleService.getScheduledUsers(<ScheduleHour>currentTimeHour);

    if (isEmpty(scheduledUsers)) return;

    await this.userScheduleRepository.manager.transaction(async (transactionEntityManager: EntityManager) => {
      // update cron last time to avoid recreating cron for same user
      const cronScheduledTime = moment().toDate();

      const users = scheduledUsers.map(({ userId }: ScheduledUser) => userId);

      await this.userScheduleService.updateLastCron(users, cronScheduledTime, transactionEntityManager);

      await scheduledUsers.reduce(async (prevPromise: Promise<void>, scheduledUser: ScheduledUser) => {
        await prevPromise;
        await new Promise((resolve: (number: number)=>void) => {
          setTimeout(resolve, 2000);
        });
        await this.showAssignmentQueue.add(scheduledUser);
      }, Promise.resolve());
    });
  }
}

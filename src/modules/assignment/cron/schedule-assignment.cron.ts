import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import type { EntityManager, Repository } from 'typeorm';

import { ScheduleHour, UserScheduleEntity, UserScheduleService } from '@/modules/user';

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
    const users = await this.userScheduleService.getScheduledUsers(<ScheduleHour>currentTimeHour);

    if (isEmpty(users)) return;

    await this.userScheduleRepository.manager.transaction(async (transactionEntityManager: EntityManager) => {
      // update cron last time to avoid recreating cron for same user
      const cronScheduledTime = moment().toDate();
      await this.userScheduleService.updateLastCron(users, cronScheduledTime, transactionEntityManager);

      await users.reduce(async (prevPromise: Promise<number>, userId: number) => {
        await prevPromise;
        return this.showAssignmentQueue.add({ userId }).then(() => userId);
      }, Promise.resolve(0));
    });
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import type { EntityManager, Repository } from 'typeorm';

import { ChatScheduleEntity } from '@/modules/schedule/entities/chat-schedule.entity';
import type { ScheduleHour, ScheduledChat } from '@/modules/schedule/schedule.interface';
import { ScheduleService } from '@/modules/schedule/schedule.service';

import { ASSIGNMENT_QUEUES } from '../assignment.constants';
import type { ShowAssignmentJobData } from '../interfaces/show-assignments.interface';

@Injectable()
export class ScheduleAssignmentCron {
  constructor(
    private scheduleService: ScheduleService,
    @InjectQueue(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS) private showAssignmentQueue: Queue<ShowAssignmentJobData>,
    @InjectRepository(ChatScheduleEntity) private chatScheduleRepository: Repository<ChatScheduleEntity>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async scheduleShowAssignmentJobs() {
    const currentTimeHour = moment().hour();
    const scheduledChats = await this.scheduleService.getScheduledChats(<ScheduleHour>currentTimeHour);

    if (isEmpty(scheduledChats)) return;

    await this.chatScheduleRepository.manager.transaction(async (transactionEntityManager: EntityManager) => {
      // update cron last time to avoid recreating cron for same user
      const cronScheduledTime = moment().toDate();

      const chatScheduleIds = scheduledChats.map(({ chatScheduleId }: ScheduledChat) => chatScheduleId);

      await this.scheduleService.updateLastCron(chatScheduleIds, cronScheduledTime, transactionEntityManager);

      await scheduledChats.reduce(async (prevPromise: Promise<void>, scheduledChat: ScheduledChat) => {
        await prevPromise;
        await this.showAssignmentQueue.add(scheduledChat);
      }, Promise.resolve());
    });
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';

import { Assignment, AssignmentService } from '@/modules/assignment';

import { NOTIFICATION_QUEUES } from '../constants';
import { NotificationEntity } from '../entities';
import { AssignmentNotification, NotificationStatus, NotifyAssignmentJobData, PendingNotifications } from '../interfaces';
import type { CreateAssignmentNotificationDto } from '../interfaces';

@Injectable()
export class NotificationService {
  private MAX_NOTIFICATION_COUNT: number = 3;

  constructor(
    @I18n() private i18n: I18nService,
    @InjectRepository(NotificationEntity) private notificationRepository: Repository<NotificationEntity>,
    private assignmentService: AssignmentService,
    @InjectQueue(NOTIFICATION_QUEUES.NOTIFY_ASSIGNMENT) private notifyAssignmentQueue: Queue<NotifyAssignmentJobData>,
  ) {}

  public async getNotificationById(id: number) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  public async saveNotification(data: CreateAssignmentNotificationDto) {
    const notification = this.notificationRepository.create(data);

    return this.notificationRepository.save(notification);
  }

  public async scheduleAssignmentNotificationJob(
    data: Pick<AssignmentNotification, 'chatId' | 'assignmentId'>,
    hoursUntilDeadline: number,
  ) {
    const assignment = await this.assignmentService.getAssignmentById(data.assignmentId);

    if (!assignment) {
      throw new Error('Notification does not exist');
    }

    const scheduledAt = this.calculateNotificationTime(assignment.deadline, hoursUntilDeadline);

    await this.validateAssignmentNotificationTime(data.chatId, assignment, scheduledAt);

    const notification = await this.saveNotification({ ...data, scheduledAt });

    const delay = this.countNotificationTimeLeft(scheduledAt);

    await this.notifyAssignmentQueue.add({ notificationId: notification.id }, { delay });

    return { assignment, scheduledAt };
  }

  private countNotificationTimeLeft(scheduledAt: Date, unitOfTime: moment.unitOfTime.Diff = 'milliseconds') {
    // notification time calculate
    const notificationScheduledAt = moment(scheduledAt);
    const now = moment();

    return notificationScheduledAt.diff(now, unitOfTime);
  }

  private calculateNotificationTime(deadline: Date, hoursUntil: number) {
    return moment(deadline).subtract(hoursUntil, 'hours').toDate();
  }

  private async validateAssignmentNotificationTime(chatId: string, assignment: Assignment, scheduledAt: Date) {
    const now = moment();
    if (moment(scheduledAt).isBefore(now)) {
      throw new Error(this.i18n.translate('notification.not-valid-hour'));
    }

    const { duplicate, notifications } = await this.getPendingNotificationCount(chatId, assignment.id, scheduledAt);

    if (notifications.length >= this.MAX_NOTIFICATION_COUNT) {
      const scheduledNotifications = notifications.map((notification: Date) => moment(notification).calendar()).join(', ');
      throw new Error(
        `Нельзя скедулить ${this.MAX_NOTIFICATION_COUNT} уведомлении на один ассайнмент\n\nВаши уведомление на этот ассайнмент: <b>${scheduledNotifications}</b>`,
      );
    }

    if (duplicate) {
      throw new Error(`У вас уже есть уведомление на время ${moment(scheduledAt).format('MMM Do YY, h:mm a')}`);
    }
  }

  private async getPendingNotificationCount(
    chatId: string,
    assignmentId: number,
    notificationDateTime: Date,
  ): Promise<PendingNotifications> {
    const query = `
      WITH chat_notifications AS (
        SELECT * FROM notification
            WHERE chat_id = $1 AND  assignment_id = $2 AND status = $3
      )
      SELECT COALESCE(ARRAY_AGG(cn.scheduled_at ORDER BY cn.scheduled_at ASC), '{}') as notifications,
          EXISTS(SELECT 1 FROM chat_notifications WHERE scheduled_at = $4) as duplicate
        FROM chat_notifications AS cn
    `;
    return this.notificationRepository
      .query(query, [chatId, assignmentId, NotificationStatus.PENDING, notificationDateTime])
      .then((rows: PendingNotifications[]) => rows[0]);
  }
}

import { OnQueueError, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { I18n, I18nService } from 'nestjs-i18n';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

import { Assignment, AssignmentService, AssignmentStatus } from '@/modules/assignment';
import { BotContext, MOODLE_BOT_ACTIONS, MOODLE_BOT_NAME, TELEGRAM_EMOJIES } from '@/modules/bot';

import { NOTIFICATION_QUEUES } from '../constants';
import type { NotifyAssignmentJobData } from '../interfaces';
import { NotificationService } from '../services';

@Processor(NOTIFICATION_QUEUES.NOTIFY_ASSIGNMENT)
export class AssignmentNotificationConsumer {
  constructor(
    @I18n() private i18n: I18nService,
    private assignmentService: AssignmentService,
    private notificationService: NotificationService,
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
  ) {}

  @Process()
  public async process(job: Job<NotifyAssignmentJobData>) {
    const { notificationId } = job.data;
    const notification = await this.notificationService.getNotificationById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    const { assignmentId, chatId } = notification;

    try {
      const assignment = await this.assignmentService.getAssignmentById(assignmentId);

      if (!assignment) throw new Error(`Assignment does not exist by id ${assignmentId}`);

      return await this.sendAssignment(chatId, assignment);

      // TODO: update notification entitiy
    } catch (err) {
      const message = this.i18n.translate<string>('notification.error', { args: { error: (<Error>err).message } });
      await this.sendMessage(chatId, message);
    }
  }

  @OnQueueError()
  public onJobError(job: Job<NotifyAssignmentJobData>, error: Error) {
    console.error(`notification id = ${job.data.notificationId}`, error);
  }

  private async sendMessage(chatId: string, message: string, extra?: ExtraReplyMessage) {
    return this.bot.telegram.sendMessage(chatId, message, extra);
  }

  private async sendAssignment(chatId: string, assignment: Assignment) {
    const { formatted } = this.assignmentService.getFormattedAssignment(assignment);

    const notificationMsg = this.i18n.translate('notification.arrived');
    const assignmentMsg = this.i18n.translate<Record<string, string>>('assignments');
    const message = `${notificationMsg}\n\n${formatted}`;

    await this.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard:
          assignment.status === AssignmentStatus.PENDING
            ? [
              [
                {
                  text: `${assignmentMsg['submitted']} ${TELEGRAM_EMOJIES.CHECK_MARK}`,
                  callback_data: `${MOODLE_BOT_ACTIONS.ASSIGNMENT_SUBMIT}${assignment.id}`,
                },
                {
                  text: `${assignmentMsg['hide']} ${TELEGRAM_EMOJIES.NO_SEE_MONKEY}`,
                  callback_data: `${MOODLE_BOT_ACTIONS.ASSIGNMENT_HIDE}${assignment.id}`,
                },
              ],
            ]
            : [],
      },
    });
  }
}

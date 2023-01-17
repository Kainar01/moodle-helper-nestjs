import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

import { Logger } from '@/common/logger/logger';
import { MOODLE_BOT_NAME, TELEGRAM_EMOJIES, MOODLE_BOT_ACTIONS } from '@/modules/bot/bot.constants';
import type { BotContext } from '@/modules/bot/interfaces/bot.interface';
import { ChatService } from '@/modules/chat/chat.service';
import { ScheduleService } from '@/modules/schedule/schedule.service';

import { ASSIGNMENT_QUEUES } from '../assignment.constants';
import type { AssignmentFormatted } from '../interfaces/assignment.interface';
import type { ShowAssignmentJobData } from '../interfaces/show-assignments.interface';
import { AssignmentService } from '../services/assignment.service';

@Processor(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS)
export class ShowAssignmentsConsumer {
  constructor(
    @I18n() private i18n: I18nService,
    private chatService: ChatService,
    private assignmentService: AssignmentService,
    private scheduleService: ScheduleService,
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
    private logger: Logger,
  ) {}

  @Process()
  public async process(job: Job<ShowAssignmentJobData>) {
    const chat = await this.chatService.findChatById(job.data.chatId);

    if (!chat) throw new Error(`Chat does not exist by id ${job.data.chatId}`);

    try {
      const { assignments, error } = await this.assignmentService.getFormattedAssignments(chat);

      if (error) throw new Error(error);

      if (isEmpty(assignments)) {
        const msg = this.i18n.translate<string>('assignments.no-assignments');
        await this.sendMessage(chat.telegramChatId, `${msg} ${TELEGRAM_EMOJIES.WINKING_AND_TONGUE}`);
      }

      await assignments.reduce(async (prevPromise: Promise<void | number>, assignment: AssignmentFormatted) => {
        await prevPromise;
        return this.sendFormattedAssignment(chat.telegramChatId, assignment);
      }, Promise.resolve());

      await this.chatService.updateChat(chat.id, { lastAssignmentNotification: moment().toDate() });
    } catch (err) {
      const message = this.i18n.translate<string>('assignments.error', { args: { error: (<Error>err).message } });
      await this.sendMessage(chat.telegramChatId, message);
      // allow user to make another request
      await this.chatService.updateChat(job.data.chatId, { lastAssignmentNotification: null, lastAssignmentRequest: null });
      throw err;
    }
  }

  @OnQueueActive()
  public async onActive(job: Job<ShowAssignmentJobData>) {
    const { scheduleId, chatId } = job.data;
    const chat = await this.chatService.findChatById(chatId);

    try {
      if (!chat) return;

      if (scheduleId) {
        const schedule = await this.scheduleService.getScheduleById(scheduleId);

        if (!schedule) {
          throw new Error(`Не валидное время уведомление ${scheduleId}`);
        }

        const message = this.i18n.translate<string>('assignments.job.processing-with-schedule', { args: { schedule: schedule.label } });
        await this.sendMessage(chat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.PLEASED}`, { parse_mode: 'Markdown' });
      } else {
        const message = this.i18n.translate<string>('assignments.job.processing');
        await this.sendMessage(chat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.PLEASED}`, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  @OnQueueFailed()
  public onJobFailed(job: Job<ShowAssignmentJobData>, error: Error) {
    this.logger.error(`Get assignment job ${job.id} failed data = ${JSON.stringify(job.data)}`, error);
  }

  private async sendMessage(chatId: number, message: string, extra?: ExtraReplyMessage) {
    return this.bot.telegram.sendMessage(chatId, message, extra);
  }

  private async sendFormattedAssignment(chatId: number, assignment: AssignmentFormatted) {
    const assignmentMsg = this.i18n.translate<Record<string, string>>('assignments');
    await this.sendMessage(chatId, assignment.formatted, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
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
          [
            {
              text: `${assignmentMsg['notify']} ${TELEGRAM_EMOJIES.CALENDAR}`,
              callback_data: `${MOODLE_BOT_ACTIONS.ASSIGNMENT_NOTIFY_OPTIONS}${assignment.id}`,
            },
          ],
        ],
      },
    });
  }
}

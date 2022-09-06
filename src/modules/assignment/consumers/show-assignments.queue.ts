import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

import { BotContext, MOODLE_BOT_ACTIONS, MOODLE_BOT_NAME, TELEGRAM_EMOJIES } from '@/modules/bot';
import { UserService } from '@/modules/user';

import { ASSIGNMENT_QUEUES } from '../assignment.constants';
import type { AssignmentFormatted, ShowAssignmentJobData } from '../interfaces';
import { AssignmentService } from '../services';

@Processor(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS)
export class ShowAssignmentsConsumer {
  constructor(
    @I18n() private i18n: I18nService,
    private userService: UserService,
    private assignmentService: AssignmentService,
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
  ) {}

  @Process()
  public async process(job: Job<ShowAssignmentJobData>) {
    const user = await this.userService.findByUserId(job.data.userId);

    if (!user) throw new Error(`User does not exist by id ${job.data.userId}`);

    try {
      const { assignments, error } = await this.assignmentService.getFormattedAssignments(user);

      if (error) throw new Error(error);

      if (isEmpty(assignments)) {
        const msg = this.i18n.translate<string>('assignments.no-assignments');
        await this.sendMessage(user.chatId, `${msg} ${TELEGRAM_EMOJIES.WINKING_AND_TONGUE}`);
      }

      await assignments.reduce(async (prevPromise: Promise<void | number>, assignment: AssignmentFormatted) => {
        await prevPromise;
        return this.sendFormattedAssignment(user.chatId, assignment);
      }, Promise.resolve());

      await this.userService.updateUser(user.id, { lastAssignmentNotification: moment().toDate() });
    } catch (err) {
      const message = this.i18n.translate<string>('assignments.error', { args: { error: (<Error>err).message } });
      await this.sendMessage(user.chatId, message);
      // allow user to make another request
      await this.userService.updateUser(job.data.userId, { lastAssignmentNotification: null, lastAssignmentRequest: null });
    }
  }

  @OnQueueActive()
  public async onActive(job: Job<ShowAssignmentJobData>) {
    const user = await this.userService.findByUserId(job.data.userId);
    if (user) {
      const message = this.i18n.translate<string>('assignments.job.processing');
      await this.sendMessage(user.chatId, `${message} ${TELEGRAM_EMOJIES.PLEASED}`);
    }
  }

  private async sendMessage(chatId: string, message: string, extra?: ExtraReplyMessage) {
    return this.bot.telegram.sendMessage(chatId, message, extra);
  }

  private async sendFormattedAssignment(chatId: string, assignment: AssignmentFormatted) {
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

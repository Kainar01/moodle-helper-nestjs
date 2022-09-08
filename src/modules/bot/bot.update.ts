import { UseFilters, UseGuards } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import { Update, InjectBot, On, Start, Command, Ctx, Action } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { Chat as TelegramCtxChat } from 'telegraf/typings/core/types/typegram';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import { Logger } from '@/common/logger/logger';

import { AssignmentStatus } from '../assignment/interfaces/assignment.interface';
import { AssignmentService } from '../assignment/services/assignment.service';
import { Chat, ChatType, type TelegramChat } from '../chat/chat.interface';
import { ChatService } from '../chat/chat.service';
import { MOODLE_BOT_ACTIONS, MOODLE_BOT_NAME, MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from './bot.constants';
import { CtxChat } from './decorators/chat.decorator';
import { BotAdminGuard } from './guards/admin.guard';
import { BotMoodleAuthGuard } from './guards/moodle-auth.guard';
import { BotNotVerifiedGuard } from './guards/not-verified.guard';
import { BotVerifiedGuard } from './guards/verified.guard';
import { type BotContext, BotCommand } from './interfaces/bot.interface';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  constructor(
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
    private chatService: ChatService,
    private assignmentService: AssignmentService,
    @I18n() private i18n: I18nService,
    private logger: Logger,
  ) {
    this.useUserMiddleware();
    this.handleError();
  }

  @UseGuards(BotVerifiedGuard)
  @Start()
  public async onStart(@Ctx() ctx: BotContext, @CtxChat() chat: Chat) {
    if (!chat.moodlePassword || !chat.moodleUsername) {
      const helloMessage = this.getMessage('bot.hello');
      await ctx.reply(`${helloMessage} ${TELEGRAM_EMOJIES.WINKING}`);

      const setUpCredsMsg = this.getMessage('bot.set-up-credentials');
      await ctx.reply(`${setUpCredsMsg} ${TELEGRAM_EMOJIES.PLEASED}`);

      const credsCautionsMsg = this.getMessage('bot.credentials-cautions');
      await ctx.reply(`${credsCautionsMsg} ${TELEGRAM_EMOJIES.HALO}`);

      await ctx.scene.enter(MOODLE_BOT_SCENES.INIT);
    } else {
      const message = this.getMessage('bot.wish');
      await ctx.reply(`${message} ${TELEGRAM_EMOJIES.HALO}`);
    }
  }

  @Command('admin')
  @UseGuards(BotAdminGuard)
  public onAdminCommand(): string {
    return 'Welcome judge';
  }

  @UseGuards(BotVerifiedGuard)
  @Command(BotCommand.INIT)
  public async onInitCommand(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.INIT);
  }

  @UseGuards(BotVerifiedGuard, BotMoodleAuthGuard)
  @Command(BotCommand.ASSIGNMENTS)
  public async onAssignmentsCommand(@CtxChat() chat: Chat): Promise<string | void> {
    const { error } = this.assignmentService.validateChatLastNotification(chat);

    if (error) return `${error} ${TELEGRAM_EMOJIES.FOLDED_HANDS}`;

    await this.assignmentService.scheduleAssignmentNotification(chat);

    const message = this.getMessage('assignments.job.scheduled');
    return `${message} ${TELEGRAM_EMOJIES.HALO}`;
  }

  @UseGuards(BotVerifiedGuard, BotMoodleAuthGuard)
  @Command(BotCommand.SCHEDULE)
  public async onScheduleCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.SCHEDULE);
  }

  @UseGuards(BotVerifiedGuard, BotMoodleAuthGuard)
  @Command(BotCommand.NOTIFY_ASSIGNMENT)
  public async onNotifyAssignmentCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.NOTIFY_ASSIGNMENT);
  }

  @UseGuards(BotNotVerifiedGuard)
  @Command(BotCommand.REQUEST_VERIFY)
  public async onRequestVerifyCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.REQUEST_VERIFY);
  }

  @UseGuards(BotVerifiedGuard)
  @Command(BotCommand.LEAVE_FEEDBACK)
  public async onLeaveFeedbackCommand(@Ctx() ctx: BotContext): Promise<string | void> {
    await ctx.scene.enter(MOODLE_BOT_SCENES.FEEDBACK);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ASSIGNMENT_SUBMIT}\\d`))
  public async onAssignmentSubmittedAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const assignmentId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ASSIGNMENT_SUBMIT, ''));

    const { title } = await this.assignmentService.updateAssignment(assignmentId, { status: AssignmentStatus.SUBMITTED });

    const msg = this.getMessage('assignments.submitted-assignment', { title });
    await ctx.reply(`${msg} ${TELEGRAM_EMOJIES.HALO}`, { parse_mode: 'Markdown' });
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ASSIGNMENT_HIDE}\\d`))
  public async onAssignmentHideAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const assignmentId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ASSIGNMENT_HIDE, ''));

    const { title } = await this.assignmentService.updateAssignment(assignmentId, { status: AssignmentStatus.HIDDEN });

    const msg = this.getMessage('assignments.hid-assignment', { title });
    await ctx.reply(`${msg} ${TELEGRAM_EMOJIES.HALO}`, { parse_mode: 'Markdown' });
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ASSIGNMENT_NOTIFY_OPTIONS}\\d`))
  public async onAssignmentNotifyAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const assignmentId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ASSIGNMENT_NOTIFY_OPTIONS, ''));

    await ctx.scene.enter(MOODLE_BOT_SCENES.NOTIFY_ASSIGNMENT, { assignmentId });
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_CONFIRM}\\d`))
  public async onRequestConfirmAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ADMIN_REQUEST_CONFIRM, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Пользователь не существует requestChatId=${requestChatId}`);
    }

    await this.chatService.updateChat(requestChat.id, { verified: true });

    const message = this.getMessage('request-verify.request-accepted');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.HALO}`);
  }

  @Action(new RegExp(`${MOODLE_BOT_ACTIONS.ADMIN_REQUEST_DECLINE}\\d`))
  public async onRequestDeclineAction(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const actionData = this.getCallbackData(ctx);
    const requestChatId = Number(actionData.replace(MOODLE_BOT_ACTIONS.ADMIN_REQUEST_DECLINE, ''));

    const requestChat = await this.chatService.findChatById(requestChatId);

    if (!requestChat) {
      throw new Error(`Пользователь не существует requestChatId=${requestChatId}`);
    }

    const message = this.getMessage('request-verify.request-declined');

    await ctx.telegram.sendMessage(requestChat.telegramChatId, `${message} ${TELEGRAM_EMOJIES.CONFUSED}`);
  }

  @On('text')
  public onMessage(): string {
    const message = this.getMessage('bot.wish');
    return `${message} ${TELEGRAM_EMOJIES.HALO}`;
  }

  private useUserMiddleware(): void {
    const chatMiddleware = async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
      try {
        const telegramChat = this.getTelegramChat(ctx);
        if (telegramChat) {
          const { type, id: telegramChatId, name } = telegramChat;

          let chat = await this.chatService.findChatByTelegramId(telegramChatId);

          if (!chat) {
            chat = await this.chatService.createChat({
              type: type === 'private' ? ChatType.PRIVATE : ChatType.GROUP,
              telegramChatId,
              chatGroupType: null,
              name,
            });
          } else {
            const nameChanged = name !== chat.name;
            if (nameChanged) {
              await this.chatService.updateChat(chat.id, { name });
            }
          }
          ctx.botChat = chat;
        }
      } catch (err) {
        this.logger.error(err);
      } finally {
        await next();
      }
    };

    // this.bot.use(userMiddleware);
    this.bot.use(chatMiddleware);
  }

  private getTelegramChat(ctx: BotContext): TelegramChat | null {
    if (!ctx.chat) return null;

    const { chat } = ctx;

    const isPrivateChat = chat.type === 'private';

    if (isPrivateChat) {
      const telegramUserChat = <TelegramCtxChat.PrivateChat>ctx.chat;

      return {
        id: telegramUserChat.id,
        name: telegramUserChat.first_name,
        type: ChatType.PRIVATE,
      };
    }
    const telegramGroupChat = <TelegramCtxChat.GroupChat>ctx.chat;

    return {
      id: telegramGroupChat.id,
      name: telegramGroupChat.title,
      type: ChatType.GROUP,
    };
  }

  private handleError(): void {
    this.bot.catch((err: any) => this.logger.error(err));
  }

  private getMessage<T = string>(key: string, args?: Record<string, any>) {
    return this.i18n.translate<T>(key, { args });
  }

  private getCallbackData(ctx: BotContext) {
    return <string>ctx.callbackQuery!.data;
  }
}

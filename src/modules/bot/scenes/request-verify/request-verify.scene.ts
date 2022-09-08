import { UseFilters } from '@nestjs/common';
import _ from 'lodash';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import type { Chat } from '@/modules/chat/chat.interface';
import { ChatService } from '@/modules/chat/chat.service';

import { MOODLE_BOT_ACTIONS, MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxChat } from '../../decorators/chat.decorator';
import { BaseScene } from '../base/base.scene';
import { REQUEST_VERIFY_SCENE_STEPS, REQUEST_VERIFY_SCENE_ACTIONS } from './request-verify.constants';

@Wizard(MOODLE_BOT_SCENES.REQUEST_VERIFY)
@UseFilters(TelegrafExceptionFilter)
export class RequestVerifyScene extends BaseScene {
  private NAME_KEY: string = 'name';

  constructor(@I18n() i18n: I18nService, private chatService: ChatService) {
    super(i18n);
  }

  @WizardStep(REQUEST_VERIFY_SCENE_STEPS.REQUEST_NAME)
  public async requestName(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('request-verify.enter-name');
    await ctx.reply(message);
    this.nextStep(ctx);
  }

  @WizardStep(REQUEST_VERIFY_SCENE_STEPS.REQUEST_CONFIRM)
  public async requestConfirmStep(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @Message('text') name: string,
  ): Promise<void> {
    if (!name) {
      const message = this.getMessage('request-verify.invalid-name');
      await ctx.reply(message);
      // set password step
      await this.runStep(ctx, next, REQUEST_VERIFY_SCENE_STEPS.REQUEST_NAME);
    } else {
      this.setName(ctx, name);

      const message = this.getMessage('request-verify.confirm', { name });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CONFIRM }],
            [{ text: this.commonMessages['edit'], callback_data: REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CANCEL }],
          ],
        },
      });
    }
  }

  @Action(new RegExp(`${REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CHANGE}`))
  public async requestChangeAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    await this.runStep(ctx, next, REQUEST_VERIFY_SCENE_STEPS.REQUEST_NAME);
  }

  @Action(new RegExp(`${REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CONFIRM}`))
  public async rescheduleConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxChat() chat: Chat) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    // TODO: send request to admin

    const adminChat = await this.chatService.findAdminChat();

    if (!adminChat) {
      throw new Error(this.getMessage('request-verify.no-admin'));
    }

    await this.sendAdminRequest(ctx, adminChat.telegramChatId, chat);

    const message = this.getMessage('request-verify.saved');
    await ctx.reply(`${message} ${TELEGRAM_EMOJIES.RAISING_HANDS}`);

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${REQUEST_VERIFY_SCENE_ACTIONS.REQUEST_CANCEL}`))
  public async rescheduleCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await this.leaveScene(ctx);
  }

  // TODO: move to verification module
  private async sendAdminRequest(ctx: Scenes.WizardContext, adminChatId: number, chat: Chat) {
    const message = this.getMessage('request-verify.incoming-request', { name: this.getName(ctx), chatId: chat.telegramChatId });
    await ctx.telegram.sendMessage(adminChatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: `Активировать${TELEGRAM_EMOJIES.CHECK_MARK}`, callback_data: `${MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_CONFIRM}${chat.id}` }],
          [{ text: `Отклонить${TELEGRAM_EMOJIES.CROSS_MARK}`, callback_data: `${MOODLE_BOT_ACTIONS.VERIFICATION_REQUEST_DECLINE}${chat.id}` }],
        ],
      },
    });
  }

  private getName(ctx: Scenes.WizardContext) {
    return <string> this.getState(ctx)[this.NAME_KEY];
  }

  private setName(ctx: Scenes.WizardContext, name: string) {
    return this.setState(ctx, this.NAME_KEY, name);
  }
}

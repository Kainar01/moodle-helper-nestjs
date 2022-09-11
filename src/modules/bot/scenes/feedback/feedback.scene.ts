import { UseFilters } from '@nestjs/common';
import _ from 'lodash';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters/telegram-exception.filter';
import type { Chat } from '@/modules/chat/chat.interface';
import { ChatService } from '@/modules/chat/chat.service';
import { FeedbackService } from '@/modules/feedback/feedback.service';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxChat } from '../../decorators/chat.decorator';
import { BaseScene } from '../base/base.scene';
import { FEEDBACK_SCENE_ACTIONS, FEEDBACK_SCENE_STEPS } from './feedback.constants';

@Wizard(MOODLE_BOT_SCENES.FEEDBACK)
@UseFilters(TelegrafExceptionFilter)
export class FeedbackScene extends BaseScene {
  private FEEDBACK_KEY: string = 'feedback';

  constructor(@I18n() i18n: I18nService, private chatService: ChatService, private feedbackService: FeedbackService) {
    super(i18n);
  }

  @WizardStep(FEEDBACK_SCENE_STEPS.FEEDBACK_ENTER)
  public async feedbackEnterStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('feedback.enter-feedback');
    await ctx.reply(message);
    this.nextStep(ctx);
  }

  @WizardStep(FEEDBACK_SCENE_STEPS.FEEDBACK_CONFIRM)
  public async feedbackConfirmStep(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @Message('text') feedback: string,
  ): Promise<void> {
    if (!feedback) {
      const message = this.getMessage('feedback.invalid-feedback');
      await ctx.reply(message);
      // set password step
      await this.runStep(ctx, next, FEEDBACK_SCENE_STEPS.FEEDBACK_ENTER);
    } else {
      this.setFeedback(ctx, feedback);

      const message = this.getMessage('feedback.confirm', { feedback });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: FEEDBACK_SCENE_ACTIONS.FEEDBACK_CONFIRM }],
            [{ text: this.commonMessages['edit'], callback_data: FEEDBACK_SCENE_ACTIONS.FEEDBACK_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: FEEDBACK_SCENE_ACTIONS.FEEDBACK_CANCEL }],
          ],
        },
      });
    }
  }

  @Action(new RegExp(`${FEEDBACK_SCENE_ACTIONS.FEEDBACK_CHANGE}`))
  public async requestChangeAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    await this.runStep(ctx, next, FEEDBACK_SCENE_STEPS.FEEDBACK_ENTER);
  }

  @Action(new RegExp(`${FEEDBACK_SCENE_ACTIONS.FEEDBACK_CONFIRM}`))
  public async rescheduleConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxChat() chat: Chat) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    // TODO: send request to admin

    const adminChat = await this.chatService.findAdminChat();

    if (!adminChat) {
      throw new Error(this.getMessage('feedback.no-admin'));
    }

    await this.sendFeedback(ctx, adminChat.telegramChatId, chat);

    const message = this.getMessage('feedback.saved');
    await ctx.reply(`${message} ${TELEGRAM_EMOJIES.RAISING_HANDS}`);

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${FEEDBACK_SCENE_ACTIONS.FEEDBACK_CANCEL}`))
  public async rescheduleCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await this.leaveScene(ctx);
  }

  private async sendFeedback(ctx: Scenes.WizardContext, adminChatId: number, chat: Chat) {
    const feedbackMessage = this.getFeedback(ctx);

    const feedback = await this.feedbackService.saveFeedback({ telegramChatId: chat.id, message: feedbackMessage });

    const message = this.getMessage('feedback.feedback-left', {
      name: chat.name,
      userId: chat.id,
      feedback: feedback.message,
    });

    await ctx.telegram.sendMessage(adminChatId, message, {
      parse_mode: 'Markdown',
    });
  }

  private getFeedback(ctx: Scenes.WizardContext) {
    return <string> this.getState(ctx)[this.FEEDBACK_KEY];
  }

  private setFeedback(ctx: Scenes.WizardContext, feedback: string) {
    return this.setState(ctx, this.FEEDBACK_KEY, feedback);
  }
}

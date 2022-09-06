import { UseFilters } from '@nestjs/common';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Message, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { WebDriver } from 'selenium-webdriver';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters';
import { Schedule, User, UserScheduleService, UserService } from '@/modules/user';
import { DriverService, MoodleService } from '@/modules/webscraper/services';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxUser } from '../../decorators';
import { BaseScene } from '../base/base.scene';
import { INIT_STEPS } from './init.constants';
import { BotInitActions } from './init.interface';

@Wizard(MOODLE_BOT_SCENES.INIT)
@UseFilters(TelegrafExceptionFilter)
export class InitScene extends BaseScene {
  constructor(
    private userService: UserService,
    @I18n()i18n: I18nService,
    private driverService: DriverService,
    private moodle: MoodleService,
    private userScheduleService: UserScheduleService,
  ) {
    super(i18n);
  }

  @WizardStep(INIT_STEPS.USERNAME)
  public async enterUsername(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User): Promise<void> {
    const username = this.getState(ctx).username || user.moodleUsername;
    if (username) {
      const message = this.getMessage('authentication.set-up-username.change-existing', { username });

      await ctx.reply(message, {
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: BotInitActions.USERNAME_CHANGE }],
            [{ text: this.commonMessages['no'], callback_data: BotInitActions.USERNAME_SKIP }],
          ],
        },
        parse_mode: 'Markdown',
      });
    } else {
      const message = this.getMessage('authentication.set-up-username.enter-new-login');
      await ctx.reply(message);
      ctx.wizard.next();
    }
  }

  @WizardStep(INIT_STEPS.USERNAME_VALIDATION)
  public async validateUsername(
    @Ctx() ctx: Scenes.WizardContext,
      @Message('text') username: string,
      @Next() next: () => Promise<void>,
  ): Promise<void> {
    if (!this.isUsernameValid(username)) {
      const message = this.getMessage('authentication.set-up-username.invalid-login');
      await ctx.reply(message);
      // set username step
      await this.runStep(ctx, next, INIT_STEPS.USERNAME);
    } else {
      this.setState(ctx, 'username', username);

      await this.runStep(ctx, next, INIT_STEPS.PASSWORD);
    }
  }

  @WizardStep(INIT_STEPS.PASSWORD)
  public async enterPassword(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User): Promise<void> {
    const password = this.getState(ctx).password || user.moodlePassword;
    if (password) {
      const message = this.getMessage('authentication.set-up-password.change-existing', { password });

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['yes'], callback_data: BotInitActions.PASSWORD_CHANGE }],
            [{ text: this.commonMessages['no'], callback_data: BotInitActions.PASSWORD_SKIP }],
          ],
        },
      });
    } else {
      const message = this.getMessage('authentication.set-up-password.enter-new-password');
      await ctx.reply(message);
    }

    ctx.wizard.next();
  }

  @WizardStep(INIT_STEPS.PASSWORD_VALIDATION)
  public async validatePassword(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @Message('text') newPassword: string,
  ): Promise<void> {
    if (!newPassword) {
      const message = this.getMessage('authentication.set-up-password.invalid-password');
      await ctx.reply(message);
      // set password step
      await this.runStep(ctx, next, INIT_STEPS.PASSWORD);
    } else {
      this.setState(ctx, 'password', newPassword);

      await this.runStep(ctx, next, INIT_STEPS.CONFIRM);
    }
  }

  @WizardStep(INIT_STEPS.CONFIRM)
  public async confirm(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User): Promise<void> {
    const credentialsMsg = this.getMessage('authentication.save-credentials.save-new-credentials', this.getCredentials(ctx, user));

    await ctx.reply(credentialsMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: this.commonMessages['yes'], callback_data: BotInitActions.DATA_CONFIRM }],
          [{ text: this.commonMessages['cancel'], callback_data: BotInitActions.DATA_CANCEL }],
          [{ text: this.commonMessages['edit'], callback_data: BotInitActions.DATA_CHANGE }],
        ],
      },
    });
  }

  @Action(new RegExp(`${BotInitActions.USERNAME_SKIP}`))
  public async handleUsernameSkip(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    // set to Username step, the next step will be trigger
    await this.runStep(ctx, next, INIT_STEPS.PASSWORD);
  }

  @Action(new RegExp(`${BotInitActions.USERNAME_CHANGE}`))
  public async handleUsernameChange(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);
    const enterUsernameMsg = this.getMessage('authentication.set-up-username.enter-new-login');

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await ctx.reply(enterUsernameMsg);

    this.setStep(ctx, INIT_STEPS.USERNAME_VALIDATION);
  }

  @Action(new RegExp(`${BotInitActions.PASSWORD_SKIP}`))
  public async handlePasswordSkip(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });
    // set to password step, the next step will be trigger
    await this.runStep(ctx, next, INIT_STEPS.CONFIRM);
  }

  @Action(new RegExp(`${BotInitActions.PASSWORD_CHANGE}`))
  public async handlePasswordChange(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    const enterPasswordMsg = this.getMessage('authentication.set-up-password.enter-new-password');

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await ctx.reply(enterPasswordMsg);

    this.setStep(ctx, INIT_STEPS.PASSWORD_VALIDATION);
  }

  @Action(new RegExp(`${BotInitActions.DATA_CONFIRM}`))
  public async handleDataConfirm(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>, @CtxUser() user: User) {
    // get users schedules
    const schedules = await this.userScheduleService.getSchedulesByUserId(user.id);
    const formattedSchedules = schedules.map(({ label }: Schedule) => label).join(', ');

    const callbackMessage = this.getCallbackMessage(ctx);
    const credsMsg = this.getMessage<Record<string, string>>('authentication.save-credentials', { schedules: formattedSchedules });

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });
    await ctx.reply(`${credsMsg['save-in-progress']} ${TELEGRAM_EMOJIES.FOLDED_HANDS}`);

    const { username, password } = this.getCredentials(ctx, user);

    const { error } = await this.isValidCreds(<string>username, <string>password);

    if (!error) {
      await this.userService.updateUser(user.id, { moodleUsername: username, moodlePassword: password });

      await ctx.reply(`${credsMsg['saved-credentials']} ${TELEGRAM_EMOJIES.CLOCK}`, { parse_mode: 'Markdown' });

      await ctx.scene.leave();
    } else {
      const wrongCredsMsg = this.getMessage('authentication.save-credentials.wrong-credentials', { error });
      await ctx.reply(wrongCredsMsg);
      await this.runStep(ctx, next, INIT_STEPS.CONFIRM);
    }
  }

  @Action(new RegExp(`${BotInitActions.DATA_CANCEL}`))
  public async handleDataCancel(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${BotInitActions.DATA_CHANGE}`))
  public async handleDataChange(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} *${TELEGRAM_EMOJIES.PENCIL}*`, { parse_mode: 'Markdown' });

    // rerun first step
    await this.runStep(ctx, next, INIT_STEPS.USERNAME);
  }

  private isUsernameValid(username: string) {
    return /^\w+(\.\w+)?$/.exec(username) !== null;
  }

  private async isValidCreds(username: string, password: string) {
    return this.driverService.withDriver(async (driver: WebDriver) => this.moodle.checkLogin(username, password, driver));
  }

  private getCredentials(ctx: Scenes.WizardContext, user: User): Record<'username' | 'password', string | null> {
    const { username, password } = (<any>ctx).wizard.state;
    return {
      username: username || user.moodleUsername,
      password: password || user.moodlePassword,
    };
  }
}

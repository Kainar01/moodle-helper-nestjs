import { UseFilters } from '@nestjs/common';
import _ from 'lodash';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters';
import { User, UserScheduleService, Schedule } from '@/modules/user';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxUser } from '../../decorators';
import { BaseScene } from '../base/base.scene';
import { BOT_SCHEDULE_ACTIONS, SCHEDULE_STEPS } from './schedule.constants';

@Wizard(MOODLE_BOT_SCENES.SCHEDULE)
@UseFilters(TelegrafExceptionFilter)
export class ScheduleScene extends BaseScene {
  private MAX_SCHEDULES: number = 2;
  private SCHEDULES_KEY: string = 'schedules';
  private CURRENT_SCHEDULE_KEY: string = 'currentSchedule';

  constructor(private userScheduleService: UserScheduleService, @I18n() i18n: I18nService) {
    super(i18n);
  }

  @WizardStep(SCHEDULE_STEPS.SHOW_CURRENT_SCHEDULE)
  public async showSchedule(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User): Promise<void> {
    // SET DEFAULT STATE
    this.setDefaultState(ctx);

    const schedules = await this.userScheduleService.getSchedulesByUserId(user.id);
    const formattedSchedules = schedules.map(({ label }: Schedule) => label).join(', ');

    const message = this.getMessage('schedule.show-schedule', { schedules: formattedSchedules });

    await ctx.reply(message, {
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: this.commonMessages['yes'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CHANGE }],
          [{ text: this.commonMessages['no'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CANCEL }],
        ],
      },
      parse_mode: 'Markdown',
    });
  }

  @WizardStep(SCHEDULE_STEPS.RESCHEDULE_CONFIRM)
  public async recheduleConfirmStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const stateSchedules = this.getStateSchedules(ctx);
    // if user types something, without choosing schedules
    if (stateSchedules.length < this.MAX_SCHEDULES) {
      const message = this.getMessage('schedule.incomplete-schedule', { max: this.MAX_SCHEDULES });
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: [
            [{ text: this.commonMessages['edit'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CHANGE }],
            [{ text: this.commonMessages['cancel'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CANCEL }],
          ],
        },
      });
      return;
    }

    const schedules = await this.userScheduleService.getSchedulesByIds(stateSchedules);
    const formattedSchedules = schedules.map(({ label }: Schedule) => label).join(', ');

    const message = this.getMessage('schedule.save-schedule', { schedules: formattedSchedules });

    await ctx.reply(message, {
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: this.commonMessages['yes'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CONFIRM }],
          [{ text: this.commonMessages['edit'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CHANGE }],
          [{ text: this.commonMessages['cancel'], callback_data: BOT_SCHEDULE_ACTIONS.RESCHEDULE_CANCEL }],
        ],
      },
      parse_mode: 'Markdown',
    });
  }

  @Action(new RegExp(`${BOT_SCHEDULE_ACTIONS.RESCHEDULE_CHANGE}`))
  public async rescheduleChangeAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.PENCIL}`, { parse_mode: 'Markdown' });

    this.setDefaultState(ctx);

    await this.sendAvailableSchedules(ctx);
  }

  @Action(new RegExp(`${BOT_SCHEDULE_ACTIONS.RESCHEDULE_CONFIRM}`))
  public async rescheduleConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    await this.userScheduleService.updateUserScheduleById(user.id, <number[]> this.getState(ctx).schedules);

    const message = this.getMessage('schedule.saved-schedule');
    await ctx.reply(`${message} ${TELEGRAM_EMOJIES.RAISING_HANDS}`);

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${BOT_SCHEDULE_ACTIONS.RESCHEDULE_PICK}\\d`))
  public async reschedulePickSchedule(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const callbackMessage = this.getCallbackMessage(ctx);
    const callbackData = this.getCallbackData(ctx);
    // remove action prefix to get id as string
    const pickedScheduleId = Number(callbackData.replace(BOT_SCHEDULE_ACTIONS.RESCHEDULE_PICK, ''));
    const pickedSchedule = await this.userScheduleService.getScheduleById(pickedScheduleId);

    if (!pickedSchedule) {
      const message = this.getMessage('schedule.invalid-schedule');
      await ctx.reply(`${message} ${TELEGRAM_EMOJIES.GRINNING}`);
      return;
    }

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} *${pickedSchedule.label}*`, { parse_mode: 'Markdown' });

    // update schedules in state
    const updatedSchedules = this.updateStateSchedules(ctx, pickedSchedule.id);

    if (updatedSchedules.length >= this.MAX_SCHEDULES) {
      await this.runStep(ctx, next, SCHEDULE_STEPS.RESCHEDULE_CONFIRM);
    } else {
      // pick next schedule until this.MAX_SCHEDULES is hit
      await this.sendAvailableSchedules(ctx);
    }
  }

  @Action(new RegExp(`${BOT_SCHEDULE_ACTIONS.RESCHEDULE_CANCEL}`))
  public async rescheduleCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await ctx.scene.leave();
  }

  private async sendAvailableSchedules(ctx: Scenes.WizardContext) {
    const schedules = await this.userScheduleService.getAvailableSchedules();

    const stateSchedules = this.getStateSchedules(ctx);
    const scheduleIndex = stateSchedules.length + 1;

    const message = this.getMessage('schedule.pick-schedule', { order: scheduleIndex, max: this.MAX_SCHEDULES });

    const inlineKeyboardFlat = schedules
      // filter out already chosen ones
      .filter((schedule: Schedule) => !stateSchedules.includes(schedule.id))
      // generate dynamic inline keyboard with id as data
      .map((schedule: Schedule) => ({ text: schedule.label, callback_data: `${BOT_SCHEDULE_ACTIONS.RESCHEDULE_PICK}${schedule.id}` }));

    // split into groups of 3, it means 3 buttons each row
    const inlineKeyboardChunked = _.chunk(inlineKeyboardFlat, 3);

    await ctx.reply(message, {
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: inlineKeyboardChunked,
      },
      parse_mode: 'Markdown',
    });
  }

  private setDefaultState(ctx: Scenes.WizardContext) {
    // schedule that is being change
    this.setState(ctx, this.CURRENT_SCHEDULE_KEY, 0);
    // new schedules ctx
    this.setState(ctx, this.SCHEDULES_KEY, []);
  }

  private getStateSchedules(ctx: Scenes.WizardContext) {
    return <number[]> this.getState(ctx)[this.SCHEDULES_KEY];
  }

  private updateStateSchedules(ctx: Scenes.WizardContext, scheduleId: number) {
    const schedules = this.getStateSchedules(ctx);
    // get last this.MAX_SCHEDULES schedules
    const updatedSchedules = [...schedules, scheduleId].slice(-this.MAX_SCHEDULES);

    this.setState(ctx, this.SCHEDULES_KEY, updatedSchedules);

    return updatedSchedules;
  }
}

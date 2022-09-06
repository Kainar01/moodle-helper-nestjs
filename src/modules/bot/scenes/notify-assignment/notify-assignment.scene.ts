import { UseFilters } from '@nestjs/common';
import _, { isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import { Action, Ctx, Next, Wizard, WizardStep } from 'nestjs-telegraf';
import type { Scenes } from 'telegraf';

import { TelegrafExceptionFilter } from '@/common/filters';
import { Assignment, AssignmentFormatted, AssignmentService } from '@/modules/assignment';
import { NotificationService } from '@/modules/notification';
import type { User } from '@/modules/user';

import { MOODLE_BOT_SCENES, TELEGRAM_EMOJIES } from '../../bot.constants';
import { CtxUser } from '../../decorators';
import { BaseScene } from '../base/base.scene';
import { NOTIFY_ASSIGNMENT_SCENE_STEPS, NOTIFY_ASSIGNMENT_SCENE_ACTIONS } from './notify-assignment.constants';

// TODO: check if assignment id in state, if not let user to pick from saved assignments
@Wizard(MOODLE_BOT_SCENES.NOTIFY_ASSIGNMENT)
@UseFilters(TelegrafExceptionFilter)
export class NotifyAssignmentScene extends BaseScene {
  private NOTIFICATION_HOURS: number[] = [1, 3, 6, 9, 12, 15, 18, 21, 24, 36, 48];
  private NOTIFICATION_KEY: string = 'notification';
  private ASSIGNMENT_ID_PARAM_KEY: string = 'assignmentId';
  private ASSIGNMENT_LIST_KEY: string = 'assignmentList';
  constructor(private assignmentService: AssignmentService, private notificationService: NotificationService, @I18n() i18n: I18nService) {
    super(i18n);
  }

  @WizardStep(NOTIFY_ASSIGNMENT_SCENE_STEPS.GET_ASSIGNMENT)
  public async getAssignmentStep(
    @Ctx() ctx: Scenes.WizardContext,
      @Next() next: () => Promise<void>,
      @CtxUser() user: User,
  ): Promise<void> {
    const isAssignedPassedWithParam = !!this.getAssignmentId(ctx);

    if (!isAssignedPassedWithParam) {
      const assignments = await this.getAssignments(ctx, user);

      if (isEmpty(assignments)) {
        const message = this.getMessage('assignments.no-assignments');
        await ctx.reply(`${message} ${TELEGRAM_EMOJIES.CONFUSED}`);
        await ctx.scene.leave();
        return;
      }

      const chooseAssignmentMsg = this.getMessage('notification.choose-assignment');
      const assignmentMsg = this.formatAssignmentsMessage(assignments);

      const assignmentOptions = assignments.map(({ id }: AssignmentFormatted) => ({
        text: `#${id}`,
        callback_data: `${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.ASSIGNMENT_CHOOSE}${id}`,
      }));

      const groupedAssignmentOptions = _.chunk(assignmentOptions, 2);
      groupedAssignmentOptions.push([
        { text: this.commonMessages['cancel'], callback_data: NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_CANCEL },
      ]);

      await ctx.reply(chooseAssignmentMsg);
      await ctx.reply(assignmentMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          one_time_keyboard: true,
          inline_keyboard: groupedAssignmentOptions,
        },
      });
    } else {
      await this.runStep(ctx, next, NOTIFY_ASSIGNMENT_SCENE_STEPS.NOTIFICATION_OPTIONS);
    }
  }

  @WizardStep(NOTIFY_ASSIGNMENT_SCENE_STEPS.NOTIFICATION_OPTIONS)
  public async notificationOptionsStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const assignmentId = this.getAssignmentId(ctx);

    if (!assignmentId) {
      throw new Error('Ассайнмента не существет');
    }

    const assignment = await this.assignmentService.getAssignmentById(assignmentId);

    if (!assignment) {
      // if assignment was not passed in params, this should not happen
      throw new Error('Ассайнмента не существует');
    }

    const message = this.getMessage('notification.show-assignment', { title: assignment.title });

    // TODO: handle empty hour list
    const notificationOptions = this.getNotificationHours(assignment.deadline).map((notificationHour: number) => ({
      text: `${notificationHour}`,
      callback_data: `${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_HOUR_PICK}${notificationHour}`,
    }));
    const chunkedNotificationOptions = _.chunk(notificationOptions, 4);

    await ctx.reply(message, {
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: chunkedNotificationOptions,
      },
      parse_mode: 'Markdown',
    });
  }

  @WizardStep(NOTIFY_ASSIGNMENT_SCENE_STEPS.NOTIFICATION_CONFIRM)
  public async notificationConfirmStep(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
    const message = this.getMessage('notification.confirmation', { hour: this.getStateNotification(ctx) });

    await ctx.reply(message, {
      reply_markup: {
        remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
          [{ text: this.commonMessages['yes'], callback_data: NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_HOUR_CONFIRM }],
          [{ text: this.commonMessages['cancel'], callback_data: NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_CANCEL }],
        ],
      },
      parse_mode: 'Markdown',
    });
  }

  @Action(new RegExp(`${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.ASSIGNMENT_CHOOSE}\\d`))
  public async assignmentPickAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const assignmentId = this.getCallbackPayload(ctx, NOTIFY_ASSIGNMENT_SCENE_ACTIONS.ASSIGNMENT_CHOOSE);
    const assignment = await this.assignmentService.getAssignmentById(Number(assignmentId));

    if (!assignment) {
      throw new Error('Ассайнмент не существует, попробуйте заново');
    }

    await ctx.deleteMessage();

    this.setAssignmentId(ctx, assignment.id);

    await this.runStep(ctx, next, NOTIFY_ASSIGNMENT_SCENE_STEPS.NOTIFICATION_OPTIONS);
  }

  @Action(new RegExp(`${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_HOUR_CONFIRM}`))
  public async notificationConfirmAction(@Ctx() ctx: Scenes.WizardContext, @CtxUser() user: User) {
    const callbackMessage = this.getCallbackMessage(ctx);
    const notificationHour = this.getStateNotification(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CHECK_MARK}`, { parse_mode: 'Markdown' });

    const { scheduledAt } = await this.notificationService.scheduleAssignmentNotificationJob(
      { chatId: user.chatId, assignmentId: this.getAssignmentId(ctx) },
      notificationHour,
    );

    const message = this.getMessage('notification.confirmed', { date: moment(scheduledAt).calendar() });

    await ctx.reply(`${message} ${TELEGRAM_EMOJIES.RELEIVED}`, { parse_mode: 'Markdown' });

    await ctx.scene.leave();
  }

  @Action(new RegExp(`${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_HOUR_PICK}\\d`))
  public async pickNotificationHourAction(@Ctx() ctx: Scenes.WizardContext, @Next() next: () => Promise<void>) {
    const notificationHour = Number(this.getCallbackPayload(ctx, NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_HOUR_PICK));

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    this.setStateNotification(ctx, notificationHour);

    await this.runStep(ctx, next, NOTIFY_ASSIGNMENT_SCENE_STEPS.NOTIFICATION_CONFIRM);
  }

  @Action(new RegExp(`${NOTIFY_ASSIGNMENT_SCENE_ACTIONS.NOTIFY_CANCEL}`))
  public async notifyCancelAction(@Ctx() ctx: Scenes.WizardContext) {
    const callbackMessage = this.getCallbackMessage(ctx);

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.editMessageText(`${callbackMessage} ${TELEGRAM_EMOJIES.CROSS_MARK}`, { parse_mode: 'Markdown' });

    await this.leaveScene(ctx);
  }

  private formatAssignmentsMessage(assignments: AssignmentFormatted[]) {
    return assignments.reduce((msg: string, assignment: AssignmentFormatted) => {
      const newLine = '\n\n';
      const id = `*#${assignment.id}* `;
      const assignmentMsg = id + assignment.formatted;
      if (msg) return msg + newLine + assignmentMsg;
      return assignmentMsg;
    }, '');
  }

  private getNotificationHours(deadline: Date) {
    const hoursLeft = moment(deadline).diff(moment(), 'hours');
    return this.NOTIFICATION_HOURS.filter((hour: number) => hour <= hoursLeft);
  }

  private getStateNotification(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.NOTIFICATION_KEY];
  }

  private getAssignmentId(ctx: Scenes.WizardContext) {
    return <number> this.getState(ctx)[this.ASSIGNMENT_ID_PARAM_KEY];
  }

  private setStateNotification(ctx: Scenes.WizardContext, value: number) {
    this.setState(ctx, this.NOTIFICATION_KEY, value);
  }

  private setAssignmentId(ctx: Scenes.WizardContext, value: number) {
    this.setState(ctx, this.ASSIGNMENT_ID_PARAM_KEY, value);
  }

  private setAssignments(ctx: Scenes.WizardContext, assignments: AssignmentFormatted[]) {
    this.setState(ctx, this.ASSIGNMENT_LIST_KEY, assignments);
  }

  private async getAssignments(ctx: Scenes.WizardContext, user: User): Promise<AssignmentFormatted[]> {
    const localAssignments = <AssignmentFormatted[]> this.getState(ctx)[this.ASSIGNMENT_LIST_KEY];

    if (localAssignments) return localAssignments;

    let assignments = await this.assignmentService.getAssignmentsByUserId(user.id);
    if (isEmpty(assignments)) {
      // if no assignment found in the database
      const { assignments: syncAssignments, error } = await this.assignmentService.getAssignments(user);

      if (error) throw new Error(error);

      assignments = syncAssignments;
    }

    const formattedAssignments = assignments.map((assignment: Assignment) => this.assignmentService.getFormattedAssignment(assignment));

    // save locally to not browse moodle again
    this.setAssignments(ctx, formattedAssignments);

    return formattedAssignments;
  }
}

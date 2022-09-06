import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import { InsertResult, MoreThan, Repository, UpdateResult } from 'typeorm';

import { TELEGRAM_EMOJIES } from '@/modules/bot';
import { User, UserService } from '@/modules/user';

import { MoodleAssignmentService } from '.';
import {
  ASSIGNMENT_NOTIFICATION_COOLDOWN_MILLISECONDS,
  ASSIGNMENT_QUEUES,
  ASSIGNMENT_REQUEST_COOLDOWN_MILLISECONDS,
} from '../assignment.constants';
import { AssignmentEntity } from '../entities';
import {
  Assignment,
  AssignmentFormatted,
  AssignmentFormattedListRO,
  AssignmentListRO,
  AssignmentStatus,
  MoodleAssignment,
  ShowAssignmentJobData,
} from '../interfaces';
import type { UpdateAssignmentDto } from '../interfaces/dto';
import type { CreateAssignmentDto } from '../interfaces/dto/create-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @I18n() private i18n: I18nService,
    private userService: UserService,
    private moodleAssignmentService: MoodleAssignmentService,
    @InjectQueue(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS) private showAssignmentQueue: Queue<ShowAssignmentJobData>,
    @InjectRepository(AssignmentEntity) private assignmentRepository: Repository<AssignmentEntity>,
  ) {}

  public async updateAssignment(
    id: number,
    data: UpdateAssignmentDto,
  ): Promise<Pick<Assignment, 'id' | 'title' | 'courseTitle' | 'deadline' | 'status'>> {
    return this.assignmentRepository
      .createQueryBuilder()
      .update({ ...data })
      .where('id= :id', { id })
      .returning('id, title, deadline, status, course_title as "courseTitle"')
      .execute()
      .then(({ raw }: UpdateResult) => <Assignment>raw[0]);
  }

  public async scheduleAssignmentNotification(user: User, delay?: number) {
    await this.showAssignmentQueue.add({ userId: user.id }, { delay });
    await this.userService.updateUser(user.id, { lastAssignmentRequest: moment().toDate() });
  }

  /**
   * NEED TO FIX THIS SERVICE.
   * Prior to cooldown, it returns wrong seconds
   */
  public validateUserLastNotification({ lastAssignmentNotification, lastAssignmentRequest }: User) {
    if (lastAssignmentNotification || lastAssignmentRequest) {
      // check rate limit after user got notification
      if (lastAssignmentNotification) {
        const { error } = this.getCooldownMessage(
          lastAssignmentNotification,
          ASSIGNMENT_NOTIFICATION_COOLDOWN_MILLISECONDS,
          'assignments.cooldown-wait',
        );

        if (error) {
          return { error };
        }
      }

      // check rate limit after request for assignments was made
      // this part only executes when notification was failed or in queue for a long time
      if (lastAssignmentRequest) {
        const { error } = this.getCooldownMessage(
          lastAssignmentRequest,
          ASSIGNMENT_REQUEST_COOLDOWN_MILLISECONDS,
          'assignments.job.too-many-requests',
        );

        if (error) {
          return { error };
        }
      }
    }

    return { error: null };
  }

  public async getAssignmentById(assignmentId: number): Promise<Assignment | null> {
    return this.assignmentRepository.findOne({ where: { id: assignmentId } });
  }

  public async getAssignmentByMoodleId(assignmentId: string): Promise<Assignment | null> {
    return this.assignmentRepository.findOne({ where: { assignmentId } });
  }

  public async getAssignmentsByUserId(userId: number): Promise<Assignment[]> {
    return this.assignmentRepository.find({ where: { userId, status: AssignmentStatus.PENDING, deadline: MoreThan(moment().toDate()) } });
  }

  public async getAssignments(user: User): Promise<AssignmentListRO> {
    const { events: moodleAssignments, error } = await this.moodleAssignmentService.getAssignments(user);

    if (error || !moodleAssignments) return { error, assignments: [] };

    const assignmentsDto: CreateAssignmentDto[] = moodleAssignments.map(
      ({ title, date, link, courseTitle, eventId }: MoodleAssignment) => ({
        title,
        userId: user.id,
        deadline: date,
        link,
        courseTitle,
        assignmentId: eventId,
      }),
    );

    const assignments = await this.saveAssignments(assignmentsDto);

    const filteredAssignments = assignments.filter((assignment: Assignment) => assignment.status === AssignmentStatus.PENDING);

    return { error: null, assignments: filteredAssignments };
  }

  public async getFormattedAssignments(user: User): Promise<AssignmentFormattedListRO> {
    const { assignments, error } = await this.getAssignments(user);

    if (error) return { error, assignments: [] };

    if (!assignments) return { error: null, assignments: [] };

    const formattedAssignments: AssignmentFormatted[] = [];
    const filteredEvents = assignments
      // get this week's assignments
      .filter(({ deadline }: Assignment) => moment(deadline).diff(moment(new Date()), 'days') <= 7)
      // get upcoming assignments
      .filter(({ deadline }: Assignment) => moment(deadline).isAfter(moment()));

    for (const assignment of filteredEvents) {
      const formatted = this.getFormattedAssignment(assignment);
      formattedAssignments.push(formatted);
    }

    return { error, assignments: formattedAssignments };
  }

  public getFormattedAssignment(assignment: Assignment) :AssignmentFormatted {
    const { title, deadline, link, courseTitle } = assignment;
    let formattedAssignment = '';
    // TITLE
    formattedAssignment += `${title.toLowerCase().includes('quiz') ? TELEGRAM_EMOJIES.EXCLAMATION : ''} *${title}*\n\n`;
    // DEADLINE DATE
    formattedAssignment += `${TELEGRAM_EMOJIES.CALENDAR} ${moment(deadline).format('dddd, MMMM Do YYYY, h:mm a')}\n\n`;
    // TIME LEFT
    formattedAssignment += `${TELEGRAM_EMOJIES.CLOCK} ${this.getDeadline(deadline)}\n\n`;
    // LINK
    formattedAssignment += `${TELEGRAM_EMOJIES.LINK} ${link}\n\n`;
    // COURSE NAME
    formattedAssignment += `${TELEGRAM_EMOJIES.LEDGER} ${courseTitle}\n\n`;

    return { ...assignment, formatted: formattedAssignment };
  }

  private getDeadline(deadline: Date) {
    const now = moment();

    const timeLeft = this.getTimeLeft(now, deadline);

    if (timeLeft.days) {
      return this.i18n.translate<string>('assignments.deadline_with_days', { args: { ...timeLeft } });
    }
    if (timeLeft.hours) {
      return this.i18n.translate<string>('assignments.deadline_with_hours', { args: { ...timeLeft } });
    }
    return this.i18n.translate<string>('assignments.deadline_with_minutes', { args: { ...timeLeft } });
  }

  private getTimeLeft(from: Date | moment.Moment, to: Date | moment.Moment) {
    const now = moment(from);
    const diff = moment(to).diff(now, 'milliseconds');
    const duration = moment.duration(diff, 'milliseconds');

    return {
      days: duration.days(),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
    };
  }

  private getCooldownCountdown(from: Date | moment.Moment, to: Date | moment.Moment) {
    const args = this.getTimeLeft(from, to);

    const timeLeftMsgKey = args.minutes ? 'assignments.cooldown-minutes' : 'assignments.cooldown-seconds';
    return this.i18n.translate<string>(timeLeftMsgKey, { args });
  }

  private getCooldownMessage(lastRequest: Date | moment.Moment, cooldownInMilliseconds: number, msgKey: string) {
    const now = moment();

    const lastRequestDate = moment(lastRequest);
    // next date when request is available again
    const allowedRequestDate = lastRequestDate.clone().add(cooldownInMilliseconds, 'milliseconds');

    if (allowedRequestDate.isAfter(now)) {
      // get left time until next request allowed date
      const left = this.getCooldownCountdown(now, allowedRequestDate);

      const errMsg = this.i18n.translate<string>(msgKey, { args: { left } });

      return { error: errMsg };
    }
    return { error: null };
  }

  private async saveAssignments(assignments: CreateAssignmentDto[]) {
    // todo fix bug: inserting duplicate values
    return this.assignmentRepository
      .createQueryBuilder('a')
      .insert()
      .values(assignments)
      .orUpdate(['title', 'link', 'course_title', 'deadline'], ['assignment_id', 'user_id'])
      .returning('id, link, title, course_title as "courseTitle", deadline, status, type, assignment_id as "assignmentId"')
      .execute()
      .then(({ raw }: InsertResult) => <Assignment[]>raw);
  }
}

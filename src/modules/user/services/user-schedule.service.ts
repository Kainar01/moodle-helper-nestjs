import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import type { EntityManager, Repository } from 'typeorm';

import { ConfigService } from '@/common';

import { ScheduleEntity, UserScheduleEntity } from '../entities';
import type { Schedule, ScheduleHour, UserSchedule } from '../interfaces';

@Injectable()
export class UserScheduleService {
  constructor(
    @InjectRepository(UserScheduleEntity) private userScheduleRepository: Repository<UserScheduleEntity>,
    @InjectRepository(ScheduleEntity) private scheduleRepository: Repository<ScheduleEntity>,
    private config: ConfigService,
  ) {}

  public async getScheduleById(id: number): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({ where: { id } });
  }

  public async getAvailableSchedules(): Promise<Schedule[]> {
    return this.scheduleRepository.find({ where: {}, order: { order: 'ASC' } });
  }

  public async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    return this.userScheduleRepository
      .createQueryBuilder('us')
      .select('s.*')
      .innerJoin('schedule', 's', 's.id = us.schedule_id')
      .where('us.user_id = :userId', { userId })
      .getRawMany<Schedule>();
  }

  public async getSchedulesByIds(ids: number[]): Promise<Schedule[]> {
    return this.scheduleRepository.createQueryBuilder('s').select('s.*').where('s.id IN (:...ids)', { ids }).getRawMany<Schedule>();
  }

  public async getScheduledUsers(hour: ScheduleHour): Promise<number[]> {
    // hour when cron started
    const cronStart = moment().set({ hour, minute: 0, second: 0, milliseconds: 0 }).toDate();

    let qb = this.userScheduleRepository
      .createQueryBuilder('us')
      .select(['distinct u.id as user_id'])
      .innerJoin('user', 'u', 'u.id = us.user_id')
      .innerJoin('schedule', 's', 's.id = us.schedule_id')
      .where('s.hour = :hour', { hour })
      .andWhere('u.moodle_username is not null')
      .andWhere('u.moodle_password is not null')
      // last cron has to be smaller than hour cron starts, to avoid duplicate cron jobs
      .andWhere('us.last_cron IS NULL OR us.last_cron < :cronStart', { cronStart }); // us.last_cron IS NULL OR
    // if verification is not disabled, filter verified users to schedule
    if (!this.config.get('bot.auth.verificationDisabled')) qb = qb.andWhere('u.verified = true');

    return qb
      .getRawMany<Record<'user_id', number>>()
      .then((rows: Record<'user_id', number>[]) => rows.map((row: Record<'user_id', number>) => row.user_id));
  }

  public async updateLastCron(userIds: number[], newCron: UserSchedule['lastCron'], transactionManager?: EntityManager) {
    let qb;
    if (transactionManager) {
      qb = transactionManager.createQueryBuilder(UserScheduleEntity, 'us');
    } else {
      qb = this.userScheduleRepository.createQueryBuilder();
    }
    await qb.update().set({ lastCron: newCron }).where('user_id IN (:...userIds)', { userIds }).execute();
  }

  public async updateUserSchedule(userId: number, hours: number[]) {
    await this.userScheduleRepository.query(
      `
      WITH "schedules" AS (
        SELECT id
        FROM "schedule" AS "s"
        WHERE "s".hour IN ($2, $3)
      ), 
      "delete_old_schedules" AS (
          DELETE FROM "user_schedule" 
          WHERE "user_id" = $1 
          AND "schedule_id" NOT IN ( SELECT "id" FROM "schedules" )
      )
      INSERT INTO "user_schedule" ("schedule_id", "user_id")
          SELECT "s"."id", $1
          FROM "schedules" AS "s"
          WHERE NOT EXISTS (
              SELECT 1
              FROM "user_schedule" AS "us"
              WHERE "us"."user_id" = $1 AND "us"."schedule_id" = "s"."id"
          )
    `,
      [userId, ...hours],
    );
  }

  public async updateUserScheduleById(userId: number, ids: number[]) {
    const scheduleIds = ids.join(', ');
    await this.userScheduleRepository.query(
      `
      WITH "delete_old_schedules" AS (
          DELETE FROM "user_schedule" 
          WHERE "user_id" = $1 
          AND "schedule_id" NOT IN ( ${scheduleIds} )
      )
      INSERT INTO "user_schedule" ("schedule_id", "user_id")
        SELECT new_schedule_id, $1 FROM unnest( ARRAY[${scheduleIds}] ) AS new_schedule_id
          WHERE NOT EXISTS (
              SELECT 1
              FROM "user_schedule" AS "us"
              WHERE "us"."user_id" = $1 AND "us"."schedule_id" = "new_schedule_id"
          )
    `,
      [userId],
    );
  }
}

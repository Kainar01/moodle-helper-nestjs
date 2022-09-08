import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import type { EntityManager, Repository } from 'typeorm';

import { ChatScheduleEntity } from './entities/chat-schedule.entity';
import { ScheduleEntity } from './entities/schedule.entity';
import type { Schedule, ScheduledChat, ScheduleHour, ChatSchedule } from './schedule.interface';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ChatScheduleEntity) private chatScheduleRepository: Repository<ChatScheduleEntity>,
    @InjectRepository(ScheduleEntity) private scheduleRepository: Repository<ScheduleEntity>,
    private config: ConfigService,
  ) {}

  public async getScheduleById(id: number): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({ where: { id } });
  }

  public async getAvailableSchedules(): Promise<Schedule[]> {
    return this.scheduleRepository.find({ where: {}, order: { order: 'ASC' } });
  }

  public async getSchedulesByChatId(chatId: number): Promise<Schedule[]> {
    return this.chatScheduleRepository
      .createQueryBuilder('us')
      .select('s.*')
      .innerJoin('schedule', 's', 's.id = us.schedule_id')
      .where('us.chat_id = :chatId', { chatId })
      .getRawMany<Schedule>();
  }

  public async getSchedulesByIds(ids: number[]): Promise<Schedule[]> {
    return this.scheduleRepository.createQueryBuilder('s').select('s.*').where('s.id IN (:...ids)', { ids }).getRawMany<Schedule>();
  }

  public async getScheduledChats(hour: ScheduleHour): Promise<ScheduledChat[]> {
    // hour when cron started
    const cronStart = moment().set({ hour, minute: 0, second: 0, milliseconds: 0 }).toDate();

    let qb = this.chatScheduleRepository
      .createQueryBuilder('cs')
      .select(['distinct c.id as "chatId"', 's.id as "scheduleId"', 'cs.id as "userScheduleId"'])
      .innerJoin('chat', 'c', 'c.id = cs.chat_id')
      .innerJoin('schedule', 's', 's.id = cs.schedule_id')
      .where('s.hour = :hour', { hour })
      .andWhere('u.moodle_username is not null')
      .andWhere('u.moodle_password is not null')
      // last cron has to be smaller than hour cron starts, to avoid duplicate cron jobs
      .andWhere('( cs.last_cron IS NULL OR cs.last_cron < :cronStart )', { cronStart }); // us.last_cron IS NULL OR
    // if verification is not disabled, filter verified users to schedule
    if (!this.config.get('bot.auth.verificationDisabled')) qb = qb.andWhere('u.verified = true');

    return qb.getRawMany<ScheduledChat>();
  }

  public async updateLastCron(id: number[], newCron: ChatSchedule['lastCron'], transactionManager?: EntityManager) {
    let qb;
    if (transactionManager) {
      qb = transactionManager.createQueryBuilder(ChatScheduleEntity, 'cs');
    } else {
      qb = this.chatScheduleRepository.createQueryBuilder();
    }
    await qb.update().set({ lastCron: newCron }).where('id IN (:...id)', { id }).execute();
  }

  public async updateChatScheduleWithHours(chatId: number, hours: number[]) {
    await this.chatScheduleRepository.query(
      `
      WITH "schedules" AS (
        SELECT id
        FROM "schedule" AS "s"
        WHERE "s".hour IN ($2, $3)
      ), 
      "delete_old_schedules" AS (
          DELETE FROM "chat_schedule" 
          WHERE "chat_id" = $1 
          AND "schedule_id" NOT IN ( SELECT "id" FROM "schedules" )
      )
      INSERT INTO "chat_schedule" ("schedule_id", "chat_id")
          SELECT "s"."id", $1
          FROM "schedules" AS "s"
          WHERE NOT EXISTS (
              SELECT 1
              FROM "chat_schedule" AS "cs"
              WHERE "cs"."chat_id" = $1 AND "cs"."schedule_id" = "s"."id"
          )
    `,
      [chatId, ...hours],
    );
  }

  public async updateChatSchedule(chatId: number, ids: number[]) {
    const scheduleIds = ids.join(', ');
    await this.chatScheduleRepository.query(
      `
      WITH "delete_old_schedules" AS (
          DELETE FROM "chat_schedule"
          WHERE "chat_id" = $1
          AND "schedule_id" NOT IN ( ${scheduleIds} )
      )
      INSERT INTO "chat_schedule" ("schedule_id", "chat_id")
        SELECT new_schedule_id, $1 FROM unnest( ARRAY[${scheduleIds}] ) AS new_schedule_id
          WHERE NOT EXISTS (
              SELECT 1
              FROM "chat_schedule" AS "cs"
              WHERE "cs"."chat_id" = $1 AND "cs"."schedule_id" = "new_schedule_id"
          )
    `,
      [chatId],
    );
  }
}

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import type { ChatSchedule } from '../schedule.interface';
import { ScheduleEntity } from './schedule.entity';
import { ChatEntity } from '../../chat/chat.entity';

@Entity('chat_schedule')
@Unique(['chatId', 'scheduleId'])
export class ChatScheduleEntity implements ChatSchedule {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'schedule_id' })
  scheduleId!: number;

  @Column('int', { nullable: false, name: 'chat_id' })
  chatId!: number;

  @Index()
  @Column('timestamptz', { nullable: true, name: 'last_cron' })
  lastCron!: Date | null;

  @ManyToOne(() => ScheduleEntity, (schedule) => schedule.chatSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'schedule_id' })
  public schedule!: ScheduleEntity;

  @ManyToOne(() => ChatEntity, (chat) => chat.chatSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'chat_id' })
  public chat!: ChatEntity;
}

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import type { UserSchedule } from '../interfaces';
import { ScheduleEntity } from './schedule.entity';
import { UserEntity } from './user.entity';

@Entity('user_schedule')
@Unique(['userId', 'scheduleId'])
export class UserScheduleEntity implements UserSchedule {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'schedule_id' })
  scheduleId!: number;

  @Column('int', { nullable: false, name: 'user_id' })
  userId!: number;

  @Index()
  @Column('timestamptz', { nullable: true, name: 'last_cron' })
  lastCron!: Date | null;

  @ManyToOne(() => ScheduleEntity, (schedule) => schedule.userSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'schedule_id' })
  public schedule!: ScheduleEntity;

  @ManyToOne(() => UserEntity, (user) => user.userSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'user_id' })
  public user!: UserEntity;
}

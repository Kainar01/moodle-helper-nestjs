import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Schedule, ScheduleHour } from '../schedule.interface';
import { ChatScheduleEntity } from './chat-schedule.entity';

@Entity('schedule')
export class ScheduleEntity implements Schedule {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: true, name: 'order' })
  order!: number | null;

  @Column({ type: 'enum', enum: ScheduleHour, nullable: false, name: 'hour', unique: true })
  hour!: ScheduleHour;

  @Column('varchar', { nullable: false, name: 'label' })
  label!: string;

  @OneToMany(() => ChatScheduleEntity, (chatSchedule) => chatSchedule.schedule, {
    cascade: true,
  })
  public chatSchedules?: ChatScheduleEntity[];
}

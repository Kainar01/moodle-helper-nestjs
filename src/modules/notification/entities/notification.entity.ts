import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { AssignmentNotification, NotificationStatus } from '../interfaces';

@Entity('notification')
@Unique(['chatId', 'assignmentId', 'scheduledAt'])
export class NotificationEntity implements AssignmentNotification {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('varchar', { nullable: false, name: 'chat_id' })
  chatId!: string;

  @Column('int', { nullable: false, name: 'assignment_id' })
  assignmentId!: number;

  @Column({ type: 'timestamptz', nullable: false, name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: NotificationStatus, nullable: false, default: NotificationStatus.PENDING, name: 'status' })
  status!: NotificationStatus;
}

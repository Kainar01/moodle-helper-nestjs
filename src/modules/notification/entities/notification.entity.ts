import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { type AssignmentNotification, NotificationStatus } from '../interfaces/notification.interface';


@Entity('notification')
@Unique(['telegramChatId', 'assignmentId', 'scheduledAt'])
export class NotificationEntity implements AssignmentNotification {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('bigint', { nullable: false, name: 'telegram_chat_id' })
  telegramChatId!: number;

  @Column('int', { nullable: false, name: 'assignment_id' })
  assignmentId!: number;

  @Column({ type: 'timestamptz', nullable: false, name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: NotificationStatus, nullable: false, default: NotificationStatus.PENDING, name: 'status' })
  status!: NotificationStatus;
}

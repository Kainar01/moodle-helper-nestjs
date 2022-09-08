import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AssignmentEntity } from '../assignment/entities/assignment.entity';
import { ChatScheduleEntity } from '../schedule/entities/chat-schedule.entity';

import { Chat, ChatType, ChatGroupType } from './chat.interface';

@Entity('chat')
export class ChatEntity implements Chat {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'chat_id', unique: true })
  telegramChatId!: number;

  @Column('varchar', { nullable: false, name: 'name' })
  name!: string;

  @Column({ type: 'enum', enum: ChatType, nullable: false, name: 'type' })
  type!: ChatType;

  @Index()
  @Column({ type: 'enum', enum: ChatGroupType, nullable: false, default: null, name: 'chat_group_type', unique: true })
  chatGroupType!: ChatGroupType | null;

  @Column('varchar', { nullable: true, name: 'moodle_username' })
  moodleUsername!: string | null;

  @Column('varchar', { nullable: true, name: 'moodle_password' })
  moodlePassword!: string | null;

  @Column('boolean', { nullable: false, default: false, name: 'verified' })
  verified!: boolean;

  @Column('timestamptz', { nullable: true, name: 'last_assignment_notification' })
  lastAssignmentNotification!: Date | null;

  @Column('timestamptz', { nullable: true, name: 'last_assignment_request' })
  lastAssignmentRequest!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => ChatScheduleEntity, (chatSchedule) => chatSchedule.chat, {
    cascade: true,
  })
  public chatSchedules?: ChatScheduleEntity[];

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.chat, {
    cascade: true,
  })
  public assignments?: AssignmentEntity[];
}

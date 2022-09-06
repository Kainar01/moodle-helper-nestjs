import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import { User, UserRole } from '../interfaces';
import { UserScheduleEntity } from './user-schedule.entity';

@Entity('user')
export class UserEntity implements User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'telegram_user_id' })
  telegramUserId!: number;

  @Column('varchar', { nullable: false, name: 'chat_id' })
  chatId!: string;

  @Column('varchar', { nullable: false, name: 'name' })
  name!: string ;

  @Column('varchar', { nullable: true, name: 'username' })
  username!: string | null;

  @Column('varchar', { nullable: true, name: 'moodle_username' })
  moodleUsername!: string | null;

  @Column('varchar', { nullable: true, name: 'moodle_password' })
  moodlePassword!: string | null;

  @Column({ type: 'enum', enum: UserRole, nullable: true, name: 'role' })
  role!: UserRole | null;

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

  @OneToMany(() => UserScheduleEntity, (userSchedule) => userSchedule.user, {
    cascade: true,
  })
  public userSchedules?: UserScheduleEntity[];
}

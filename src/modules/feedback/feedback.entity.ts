import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Feedback, FeedbackType } from './feedback.interface';

@Entity('feedback')
export class FeedbackEntity implements Feedback {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('varchar', { nullable: false, name: 'chat_id' })
  chatId!: string;

  @Column('text', { nullable: false, name: 'message' })
  message!: string;

  @Index()
  @Column({ type: 'enum', enum: FeedbackType, nullable: false, default: FeedbackType.GENERAL, name: 'type' })
  type!: FeedbackType;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

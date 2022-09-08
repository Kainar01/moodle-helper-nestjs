import { ChatEntity } from '../../../modules/chat/chat.entity';
import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { type Assignment, AssignmentStatus, AssignmentType } from '../interfaces/assignment.interface';

@Entity('assignment')
@Unique(['chatId', 'assignmentId'])
export class AssignmentEntity implements Assignment {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'chat_id' })
  chatId!: number;

  @Column('int', { nullable: false, name: 'assignment_id' })
  assignmentId!: string;

  @Column('varchar', { nullable: false, name: 'title' })
  title!: string;

  @Column('varchar', { nullable: false, name: 'link' })
  link!: string;

  @Column('varchar', { nullable: false, name: 'course_title' })
  courseTitle!: string;

  @Column({ type: 'enum', enum: AssignmentStatus, nullable: false, default: AssignmentStatus.PENDING, name: 'status' })
  status!: AssignmentStatus;

  @Column({ type: 'enum', enum: AssignmentType, nullable: false, default: AssignmentType.ASSIGNMENT, name: 'type' })
  type!: AssignmentType;

  @Column({ type: 'timestamptz', nullable: false })
  deadline!: Date;

  @ManyToOne(() => ChatEntity, (chat) => chat.assignments, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'chat_id' })
  public chat!: ChatEntity;
}

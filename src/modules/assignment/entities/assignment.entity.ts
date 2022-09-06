import { UserEntity } from '../../../modules/user';
import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Assignment, AssignmentStatus, AssignmentType } from '../interfaces';

@Entity('assignment')
@Unique(['userId', 'assignmentId'])
export class AssignmentEntity implements Assignment {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id!: number;

  @Column('int', { nullable: false, name: 'user_id' })
  userId!: number;

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

  @ManyToOne(() => UserEntity, (user) => user.userSchedules, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'user_id' })
  public user!: UserEntity;
}

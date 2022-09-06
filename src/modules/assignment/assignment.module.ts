import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

import { UserModule, UserScheduleEntity } from '../user';
import { WebScraperModule } from '../webscraper';
import { ASSIGNMENT_QUEUES } from './assignment.constants';
import { ShowAssignmentsConsumer } from './consumers';
import { ScheduleAssignmentCron } from './cron';
import { AssignmentEntity } from './entities';
import { AssignmentService, MoodleAssignmentService } from './services';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS,
    }),
    TypeOrmModule.forFeature([UserScheduleEntity, AssignmentEntity]),
    WebScraperModule,
    UserModule,
  ],
  providers: [AssignmentService, MoodleAssignmentService, ShowAssignmentsConsumer, ScheduleAssignmentCron],
  exports: [AssignmentService, MoodleAssignmentService],
})
export class AssignmentModule {}

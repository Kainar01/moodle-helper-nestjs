import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

import { ChatModule } from '../chat/chat.module';
import { ChatScheduleEntity } from '../schedule/entities/chat-schedule.entity';
import { ScheduleModule } from '../schedule/schedule.module';
import { WebScraperModule } from '../webscraper/webscraper.module';
import { ASSIGNMENT_QUEUES } from './assignment.constants';
import { ShowAssignmentsConsumer } from './consumers/show-assignments.consumer';
import { ScheduleAssignmentCron } from './cron/schedule-assignment.cron';
import { AssignmentEntity } from './entities/assignment.entity';
import { AssignmentService } from './services/assignment.service';
import { MoodleAssignmentService } from './services/moodle-assignment.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS,
    }),
    TypeOrmModule.forFeature([ChatScheduleEntity, AssignmentEntity]),
    WebScraperModule,
    ChatModule,
    ScheduleModule,
  ],
  providers: [AssignmentService, MoodleAssignmentService, ShowAssignmentsConsumer, ScheduleAssignmentCron],
  exports: [AssignmentService, MoodleAssignmentService],
})
export class AssignmentModule {}

import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssignmentModule } from '../assignment/assignment.module';
import { ChatModule } from '../chat/chat.module';
import { WebScraperModule } from '../webscraper/webscraper.module';
import { NOTIFICATION_QUEUES } from './constants/notificaiton.constants';
import { AssignmentNotificationConsumer } from './consumers/assignment-notification.consumer';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUES.NOTIFY_ASSIGNMENT,
    }),
    TypeOrmModule.forFeature([NotificationEntity]),
    WebScraperModule,
    ChatModule,
    AssignmentModule,
  ],
  providers: [NotificationService, AssignmentNotificationConsumer],
  exports: [NotificationService],
})
export class NotificationModule {}

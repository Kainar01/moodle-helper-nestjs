import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment/assignment.module';
import { ChatModule } from '../chat/chat.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { NotificationModule } from '../notification/notification.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { WebScraperModule } from '../webscraper/webscraper.module';
import { BotUpdate } from './bot.update';
import { FeedbackScene } from './scenes/feedback/feedback.scene';
import { InitScene } from './scenes/init/init.scene';
import { NotifyAssignmentScene } from './scenes/notify-assignment/notify-assignment.scene';
import { RequestVerifyScene } from './scenes/request-verify/request-verify.scene';
import { ScheduleScene } from './scenes/schedule/schedule.scene';
import { MoodleBotService } from './services/moodle-bot.service';

@Module({
  imports: [ChatModule, NotificationModule, WebScraperModule, AssignmentModule, FeedbackModule, ScheduleModule],
  providers: [BotUpdate, InitScene, ScheduleScene, NotifyAssignmentScene, RequestVerifyScene, FeedbackScene, MoodleBotService],
  exports: [MoodleBotService],
})
export class BotModule {}

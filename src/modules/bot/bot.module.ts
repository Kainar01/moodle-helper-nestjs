import { Module } from '@nestjs/common';

import { AssignmentModule } from '../assignment';
import { NotificationModule } from '../notification';
import { UserModule } from '../user';
import { WebScraperModule } from '../webscraper';
import { BotUpdate } from './bot.update';
import { InitScene } from './scenes/init/init.scene';
import { NotifyAssignmentScene } from './scenes/notify-assignment/notify-assignment.scene';
import { RequestVerifyScene } from './scenes/request-verify/request-verify.scene';
import { ScheduleScene } from './scenes/schedule/schedule.scene';
import { MoodleBotService } from './services';

@Module({
  imports: [UserModule, NotificationModule, WebScraperModule, AssignmentModule],
  providers: [BotUpdate, InitScene, ScheduleScene, NotifyAssignmentScene, RequestVerifyScene, MoodleBotService],
  exports: [MoodleBotService],
})
export class BotModule {}

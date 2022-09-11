import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScheduleModule } from '../schedule/schedule.module';
import { ChatEntity } from './chat.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity]), ScheduleModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

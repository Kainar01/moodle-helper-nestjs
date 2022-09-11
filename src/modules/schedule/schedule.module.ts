import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatScheduleEntity } from './entities/chat-schedule.entity';
import { ScheduleEntity } from './entities/schedule.entity';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatScheduleEntity, ScheduleEntity])],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}

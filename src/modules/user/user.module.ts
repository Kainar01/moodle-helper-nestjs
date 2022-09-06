import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

import { UserEntity, ScheduleEntity, UserScheduleEntity } from './entities';
import { UserScheduleService, UserService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserScheduleEntity, ScheduleEntity])],
  providers: [UserService, UserScheduleService],
  exports: [UserService, UserScheduleService],
})
export class UserModule {}

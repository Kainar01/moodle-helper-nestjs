import { ScheduleEntity } from '../../modules/schedule/entities/schedule.entity';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { scheduleSeed } from '../seed/schedule.seed';

export class scheduleSeed1662644572792 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.save(ScheduleEntity, scheduleSeed);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder(ScheduleEntity, 's')
      .delete()
      .where('hour in (:...hours)', { hours: scheduleSeed.map(({ hour }) => hour) })
      .execute();
  }
}

import { ScheduleEntity } from '../../modules/user';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { scheduleSeed } from '../seed';

export class migration1662346017986 implements MigrationInterface {
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

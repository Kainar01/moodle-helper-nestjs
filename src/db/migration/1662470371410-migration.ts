import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662470371410 implements MigrationInterface {
    name = 'migration1662470371410'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "moodle_username" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "moodle_password" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "username" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "moodle_password"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "moodle_username"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying`);
    }

}

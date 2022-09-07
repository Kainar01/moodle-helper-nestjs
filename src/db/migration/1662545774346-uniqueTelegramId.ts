import type { MigrationInterface, QueryRunner } from "typeorm";

export class uniqueTelegramId1662545774346 implements MigrationInterface {
    name = 'uniqueTelegramId1662545774346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_f1921ddb8658d793ef7a901e781" UNIQUE ("telegram_user_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_f1921ddb8658d793ef7a901e781"`);
    }

}

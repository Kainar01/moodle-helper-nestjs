import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662471464599 implements MigrationInterface {
    name = 'migration1662471464599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "chatId"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "telegram_user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "chat_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "chat_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "telegram_user_id"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "chatId" character varying NOT NULL`);
    }

}

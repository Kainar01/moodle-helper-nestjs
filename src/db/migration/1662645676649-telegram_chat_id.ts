import type { MigrationInterface, QueryRunner } from "typeorm";

export class telegramChatId1662645676649 implements MigrationInterface {
    name = 'telegramChatId1662645676649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" RENAME COLUMN "chat_id" TO "telegram_chat_id"`);
        await queryRunner.query(`ALTER TABLE "chat" RENAME CONSTRAINT "UQ_415c34dcb5ad6193a9ea9dab25e" TO "UQ_025820db46d97a48d77b966036e"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "UQ_025820db46d97a48d77b966036e"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "telegram_chat_id"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "telegram_chat_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "UQ_025820db46d97a48d77b966036e" UNIQUE ("telegram_chat_id")`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "chat_id"`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD "chat_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "UQ_0f559f249314e3e4afc167108f6"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "telegram_chat_id"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "telegram_chat_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "UQ_0f559f249314e3e4afc167108f6" UNIQUE ("telegram_chat_id", "assignment_id", "scheduled_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "UQ_0f559f249314e3e4afc167108f6"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "telegram_chat_id"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "telegram_chat_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "UQ_0f559f249314e3e4afc167108f6" UNIQUE ("telegram_chat_id", "assignment_id", "scheduled_at")`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP COLUMN "chat_id"`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD "chat_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "UQ_025820db46d97a48d77b966036e"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "telegram_chat_id"`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "telegram_chat_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "UQ_025820db46d97a48d77b966036e" UNIQUE ("telegram_chat_id")`);
        await queryRunner.query(`ALTER TABLE "chat" RENAME CONSTRAINT "UQ_025820db46d97a48d77b966036e" TO "UQ_415c34dcb5ad6193a9ea9dab25e"`);
        await queryRunner.query(`ALTER TABLE "chat" RENAME COLUMN "telegram_chat_id" TO "chat_id"`);
    }

}

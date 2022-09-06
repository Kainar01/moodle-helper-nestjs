import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662432502279 implements MigrationInterface {
    name = 'migration1662432502279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_status_enum" AS ENUM('pending', 'notified', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "chat_id" character varying NOT NULL, "assignment_id" integer NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."notification_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_24248ce4727834f2516621ae36c" UNIQUE ("chat_id", "assignment_id", "scheduled_at"), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "deadline"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD "deadline" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "deadline"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD "deadline" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_status_enum"`);
    }

}

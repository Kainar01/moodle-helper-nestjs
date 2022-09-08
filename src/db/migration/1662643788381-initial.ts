import type { MigrationInterface, QueryRunner } from "typeorm";

export class initial1662643788381 implements MigrationInterface {
    name = 'initial1662643788381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assignment_status_enum" AS ENUM('pending', 'submitted', 'hidden')`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_type_enum" AS ENUM('assignment', 'quiz')`);
        await queryRunner.query(`CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "assignment_id" integer NOT NULL, "title" character varying NOT NULL, "link" character varying NOT NULL, "course_title" character varying NOT NULL, "status" "public"."assignment_status_enum" NOT NULL DEFAULT 'pending', "type" "public"."assignment_type_enum" NOT NULL DEFAULT 'assignment', "deadline" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_b72abf3d2a1669ace7363d42cc0" UNIQUE ("chat_id", "assignment_id"), CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedule_hour_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23')`);
        await queryRunner.query(`CREATE TABLE "schedule" ("id" SERIAL NOT NULL, "order" integer, "hour" "public"."schedule_hour_enum" NOT NULL, "label" character varying NOT NULL, CONSTRAINT "UQ_efbcdcf0d14f3c66778f2ca3e08" UNIQUE ("hour"), CONSTRAINT "PK_1c05e42aec7371641193e180046" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_schedule" ("id" SERIAL NOT NULL, "schedule_id" integer NOT NULL, "chat_id" integer NOT NULL, "last_cron" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_debd93dde56a802f70ca53a44a1" UNIQUE ("chat_id", "schedule_id"), CONSTRAINT "PK_b2f9fd3ab8665ae7ee80c41f530" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8cbf66c52bcc71eab6fa5fb051" ON "chat_schedule" ("last_cron") `);
        await queryRunner.query(`CREATE TYPE "public"."chat_type_enum" AS ENUM('private', 'group')`);
        await queryRunner.query(`CREATE TYPE "public"."chat_chat_group_type_enum" AS ENUM('error', 'admin', 'superadmin')`);
        await queryRunner.query(`CREATE TABLE "chat" ("id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "name" character varying NOT NULL, "type" "public"."chat_type_enum" NOT NULL, "chat_group_type" "public"."chat_chat_group_type_enum" NOT NULL, "moodle_username" character varying, "moodle_password" character varying, "verified" boolean NOT NULL DEFAULT false, "last_assignment_notification" TIMESTAMP WITH TIME ZONE, "last_assignment_request" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_415c34dcb5ad6193a9ea9dab25e" UNIQUE ("chat_id"), CONSTRAINT "UQ_4df83e99ea23bd2f12793453498" UNIQUE ("chat_group_type"), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4df83e99ea23bd2f1279345349" ON "chat" ("chat_group_type") `);
        await queryRunner.query(`CREATE TYPE "public"."feedback_type_enum" AS ENUM('general', 'error', 'suggestion', 'new-feature')`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "message" text NOT NULL, "type" "public"."feedback_type_enum" NOT NULL DEFAULT 'general', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22d52bb865c8d21c0e7cb6204e" ON "feedback" ("type") `);
        await queryRunner.query(`CREATE TABLE "course" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_status_enum" AS ENUM('pending', 'notified', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "telegram_chat_id" integer NOT NULL, "assignment_id" integer NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."notification_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_0f559f249314e3e4afc167108f6" UNIQUE ("telegram_chat_id", "assignment_id", "scheduled_at"), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_40eb5bb5f9f1edbb66ad9a6a393" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_schedule" ADD CONSTRAINT "FK_7bbbd0179a70496add66ba0e384" FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_schedule" ADD CONSTRAINT "FK_47d5411d926efb34294e211a696" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_schedule" DROP CONSTRAINT "FK_47d5411d926efb34294e211a696"`);
        await queryRunner.query(`ALTER TABLE "chat_schedule" DROP CONSTRAINT "FK_7bbbd0179a70496add66ba0e384"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_40eb5bb5f9f1edbb66ad9a6a393"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_status_enum"`);
        await queryRunner.query(`DROP TABLE "course"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22d52bb865c8d21c0e7cb6204e"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4df83e99ea23bd2f1279345349"`);
        await queryRunner.query(`DROP TABLE "chat"`);
        await queryRunner.query(`DROP TYPE "public"."chat_chat_group_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."chat_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8cbf66c52bcc71eab6fa5fb051"`);
        await queryRunner.query(`DROP TABLE "chat_schedule"`);
        await queryRunner.query(`DROP TABLE "schedule"`);
        await queryRunner.query(`DROP TYPE "public"."schedule_hour_enum"`);
        await queryRunner.query(`DROP TABLE "assignment"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_status_enum"`);
    }

}

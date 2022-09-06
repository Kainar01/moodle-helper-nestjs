import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662346001827 implements MigrationInterface {
    name = 'migration1662346001827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assignment_status_enum" AS ENUM('pending', 'submitted', 'hidden')`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_type_enum" AS ENUM('assignment', 'quiz')`);
        await queryRunner.query(`CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "assignment_id" integer NOT NULL, "title" character varying NOT NULL, "link" character varying NOT NULL, "course_title" character varying NOT NULL, "status" "public"."assignment_status_enum" NOT NULL, "type" "public"."assignment_type_enum" NOT NULL, "deadline" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "course" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedule_hour_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23')`);
        await queryRunner.query(`CREATE TABLE "schedule" ("id" SERIAL NOT NULL, "order" integer, "hour" "public"."schedule_hour_enum" NOT NULL, "label" character varying NOT NULL, CONSTRAINT "UQ_efbcdcf0d14f3c66778f2ca3e08" UNIQUE ("hour"), CONSTRAINT "PK_1c05e42aec7371641193e180046" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'superadmin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "chatId" character varying NOT NULL, "name" character varying, "username" character varying, "role" "public"."user_role_enum", "password" character varying, "last_assignment_notification" TIMESTAMP WITH TIME ZONE, "last_assignment_request" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_schedule" ("id" SERIAL NOT NULL, "schedule_id" integer NOT NULL, "user_id" integer NOT NULL, "last_cron" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_c8c0cb793a4216969055feb69d3" UNIQUE ("user_id", "schedule_id"), CONSTRAINT "PK_1c68f6861388e111e080b7ea766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9df6ea514414498e6c7f1af091" ON "user_schedule" ("last_cron") `);
        await queryRunner.query(`ALTER TABLE "user_schedule" ADD CONSTRAINT "FK_f521c2a30965fe92253d2876ffb" FOREIGN KEY ("schedule_id") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_schedule" ADD CONSTRAINT "FK_ed398d25ddca913e979a0fca21f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_schedule" DROP CONSTRAINT "FK_ed398d25ddca913e979a0fca21f"`);
        await queryRunner.query(`ALTER TABLE "user_schedule" DROP CONSTRAINT "FK_f521c2a30965fe92253d2876ffb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9df6ea514414498e6c7f1af091"`);
        await queryRunner.query(`DROP TABLE "user_schedule"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "schedule"`);
        await queryRunner.query(`DROP TYPE "public"."schedule_hour_enum"`);
        await queryRunner.query(`DROP TABLE "course"`);
        await queryRunner.query(`DROP TABLE "assignment"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_status_enum"`);
    }

}

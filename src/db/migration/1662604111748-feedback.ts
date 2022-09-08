import type { MigrationInterface, QueryRunner } from "typeorm";

export class feedback1662604111748 implements MigrationInterface {
    name = 'feedback1662604111748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."feedback_type_enum" AS ENUM('general', 'error', 'suggestion', 'new-feature')`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "chat_id" character varying NOT NULL, "message" text NOT NULL, "type" "public"."feedback_type_enum" NOT NULL DEFAULT 'general', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22d52bb865c8d21c0e7cb6204e" ON "feedback" ("type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_22d52bb865c8d21c0e7cb6204e"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_type_enum"`);
    }

}

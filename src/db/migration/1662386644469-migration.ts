import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662386644469 implements MigrationInterface {
    name = 'migration1662386644469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "UQ_a5bc0b578c248a95d835d7680c1"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "UQ_065084b04fbb5629ecdf17e0666" UNIQUE ("user_id", "assignment_id")`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_86397cc97cdf8d3ff908f1e769f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_86397cc97cdf8d3ff908f1e769f"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "UQ_065084b04fbb5629ecdf17e0666"`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "UQ_a5bc0b578c248a95d835d7680c1" UNIQUE ("assignment_id")`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "user_id"`);
    }

}

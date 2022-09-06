import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662358876046 implements MigrationInterface {
    name = 'migration1662358876046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "type" SET DEFAULT 'assignment'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "assignment" ALTER COLUMN "status" DROP DEFAULT`);
    }

}

import type { MigrationInterface, QueryRunner } from "typeorm";

export class migration1662365111742 implements MigrationInterface {
    name = 'migration1662365111742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "UQ_a5bc0b578c248a95d835d7680c1" UNIQUE ("assignment_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "UQ_a5bc0b578c248a95d835d7680c1"`);
    }

}

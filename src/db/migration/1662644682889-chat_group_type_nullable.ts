import type { MigrationInterface, QueryRunner } from "typeorm";

export class chatGroupTypeNullable1662644682889 implements MigrationInterface {
    name = 'chatGroupTypeNullabel1662644682889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ALTER COLUMN "chat_group_type" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ALTER COLUMN "chat_group_type" SET NOT NULL`);
    }

}

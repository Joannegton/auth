import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletedAt1777166379000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ NULL
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at"
        `);
    }
}

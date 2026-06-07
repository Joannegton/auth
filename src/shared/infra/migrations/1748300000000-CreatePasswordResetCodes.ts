import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetCodes1748300000000
    implements MigrationInterface
{
    name = 'CreatePasswordResetCodes1748300000000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "password_reset_codes" (
                "id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "service_id" UUID NOT NULL,
                "code_hash" VARCHAR NOT NULL,
                "expires_at" TIMESTAMPTZ NOT NULL,
                "used_at" TIMESTAMPTZ,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "prc_user_service_idx"
            ON "password_reset_codes" ("user_id", "service_id")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_codes"`);
    }
}

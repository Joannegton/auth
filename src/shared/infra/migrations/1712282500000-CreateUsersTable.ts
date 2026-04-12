import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1712282500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'Nullable for social login users',
                    },
                    {
                        name: 'google_id',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: true,
                    },
                    {
                        name: 'provider',
                        type: 'varchar',
                        length: '50',
                        default: "'local'",
                        isNullable: false,
                        comment: "Provider: 'local', 'google', 'apple'",
                    },
                    {
                        name: 'avatar_url',
                        type: 'varchar',
                        length: '512',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // Índices para performance
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_EMAIL',
                columnNames: ['email'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_GOOGLE_ID',
                columnNames: ['google_id'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_PROVIDER',
                columnNames: ['provider'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_CREATED_AT',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users', true);
    }
}

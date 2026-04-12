import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableForeignKey,
} from 'typeorm';

export class CreateSessionsTable1712282600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'sessions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'refresh_token',
                        type: 'varchar',
                        length: '512',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamptz',
                        isNullable: false,
                    },
                    {
                        name: 'revoked',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'infinity',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'user_agent',
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

        // Foreign key para users
        await queryRunner.createForeignKey(
            'sessions',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                name: 'FK_SESSIONS_USERS',
            }),
        );

        // Índices para performance
        await queryRunner.createIndex(
            'sessions',
            new TableIndex({
                name: 'IDX_SESSIONS_USER_ID',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'sessions',
            new TableIndex({
                name: 'IDX_SESSIONS_REFRESH_TOKEN',
                columnNames: ['refresh_token'],
            }),
        );

        await queryRunner.createIndex(
            'sessions',
            new TableIndex({
                name: 'IDX_SESSIONS_EXPIRES_AT',
                columnNames: ['expires_at'],
            }),
        );

        await queryRunner.createIndex(
            'sessions',
            new TableIndex({
                name: 'IDX_SESSIONS_IS_REVOKED',
                columnNames: ['revoked'],
            }),
        );

        await queryRunner.createIndex(
            'sessions',
            new TableIndex({
                name: 'IDX_SESSIONS_CREATED_AT',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sessions', true);
    }
}

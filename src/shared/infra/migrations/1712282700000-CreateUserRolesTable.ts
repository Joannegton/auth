import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableForeignKey,
} from 'typeorm';

export class CreateUserRolesTable1712282700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_roles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'role_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'role_id_num',
                        type: 'smallint',
                        isNullable: false,
                        comment: 'Denormalizado para facilitar queries por id_num',
                    },
                    {
                        name: 'assigned_at',
                        type: 'timestamptz',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
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
            'user_roles',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                name: 'FK_USER_ROLES_USERS',
            }),
        );

        // Foreign key para roles (via PK composta: id, id_num)
        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                columnNames: ['role_id', 'role_id_num'],
                referencedColumnNames: ['id', 'id_num'],
                referencedTableName: 'roles',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                name: 'FK_USER_ROLES_ROLES',
            }),
        );

        // Constraint única para evitar duplicatas
        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_UNIQUE',
                columnNames: ['user_id', 'role_id'],
                isUnique: true,
            }),
        );

        // Índices para performance
        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_USER_ID',
                columnNames: ['user_id'],
            }),
        );

        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_ROLE_ID',
                columnNames: ['role_id'],
            }),
        );

        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_ROLE_ID_NUM',
                columnNames: ['role_id_num'],
            }),
        );

        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_ASSIGNED_AT',
                columnNames: ['assigned_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user_roles', true);
    }
}

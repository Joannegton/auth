import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRolesTable1712282400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'roles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                    {
                        name: 'id_num',
                        type: 'smallint',
                        isPrimary: true,
                        comment: 'Compõe a chave primária composta com id',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '255',
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
            'roles',
            new TableIndex({
                name: 'IDX_ROLES_ID_NUM',
                columnNames: ['id_num'],
            }),
        );

        await queryRunner.createIndex(
            'roles',
            new TableIndex({
                name: 'IDX_ROLES_NAME',
                columnNames: ['name'],
            }),
        );

        await queryRunner.createIndex(
            'roles',
            new TableIndex({
                name: 'IDX_ROLES_CREATED_AT',
                columnNames: ['created_at'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('roles', true);
    }
}

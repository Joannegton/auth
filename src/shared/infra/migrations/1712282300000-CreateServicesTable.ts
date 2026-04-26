import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateServicesTable1712282300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'services',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'api_key',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
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

        // Índices para performance
        await queryRunner.createIndex(
            'services',
            new TableIndex({
                name: 'IDX_SERVICES_NAME',
                columnNames: ['name'],
            }),
        );

        await queryRunner.createIndex(
            'services',
            new TableIndex({
                name: 'IDX_SERVICES_API_KEY',
                columnNames: ['api_key'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('services', true);
    }
}

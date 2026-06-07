import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddServiceIdToUserRoles1712282950000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adiciona a coluna service_id
        await queryRunner.addColumn(
            'user_roles',
            new TableColumn({
                name: 'service_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        // Popula service_id usando a relação com users
        await queryRunner.query(
            `UPDATE user_roles ur SET service_id = u.service_id FROM users u WHERE ur.user_id = u.id`,
        );

        // Torna a coluna NOT NULL
        await queryRunner.changeColumn(
            'user_roles',
            'service_id',
            new TableColumn({
                name: 'service_id',
                type: 'uuid',
                isNullable: false,
            }),
        );

        // Remove o índice único anterior (user_id, role_id)
        const uniqueIndex = (await queryRunner.query(
            `SELECT indexname FROM pg_indexes WHERE tablename = 'user_roles' AND indexname LIKE '%user_id%role_id%'`,
        ))[0];

        if (uniqueIndex) {
            await queryRunner.query(`DROP INDEX ${uniqueIndex.indexname}`);
        }

        // Adiciona FK para services
        await queryRunner.query(
            `ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_service_id FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE`,
        );

        // Adiciona novo índice único por (user_id, role_id, service_id)
        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ROLES_USER_ROLE_SERVICE',
                columnNames: ['user_id', 'role_id', 'service_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove o índice único
        await queryRunner.dropIndex(
            'user_roles',
            'IDX_USER_ROLES_USER_ROLE_SERVICE',
        );

        // Remove a FK
        await queryRunner.query(
            `ALTER TABLE user_roles DROP CONSTRAINT fk_user_roles_service_id`,
        );

        // Remove a coluna service_id
        await queryRunner.dropColumn('user_roles', 'service_id');

        // Restaura o índice único anterior
        await queryRunner.createIndex(
            'user_roles',
            new TableIndex({
                name: 'IDX_USER_ID_ROLE_ID',
                columnNames: ['user_id', 'role_id'],
                isUnique: true,
            }),
        );
    }
}

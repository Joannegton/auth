import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableIndex,
} from 'typeorm';

export class AddServiceIdToUsers1712282900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const authService = await queryRunner.query(
            `SELECT id FROM services WHERE name = 'auth-service'`,
        );

        const authServiceId = authService[0]?.id;

        if (!authServiceId) {
            throw new Error('auth-service not found in services table');
        }

        // Adiciona a coluna service_id com um padrão temporário
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'service_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        // Atualiza todos os usuários existentes para usar o auth-service
        await queryRunner.query(
            `UPDATE users SET service_id = $1 WHERE service_id IS NULL`,
            [authServiceId],
        );

        // Torna a coluna NOT NULL
        await queryRunner.changeColumn(
            'users',
            'service_id',
            new TableColumn({
                name: 'service_id',
                type: 'uuid',
                isNullable: false,
            }),
        );

        // Remove o constraint UNIQUE de email (era global, agora será por service)
        const uniqueConstraint = (
            await queryRunner.query(
                `SELECT constraint_name FROM information_schema.table_constraints
             WHERE table_name = 'users' AND constraint_type = 'UNIQUE' AND constraint_name LIKE '%email%'`,
            )
        )[0];

        if (uniqueConstraint) {
            await queryRunner.query(
                `ALTER TABLE users DROP CONSTRAINT ${uniqueConstraint.constraint_name}`,
            );
        }

        // Adiciona FK para services
        await queryRunner.query(
            `ALTER TABLE users ADD CONSTRAINT fk_users_service_id FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE`,
        );

        // Adiciona índice único por (email, service_id)
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_EMAIL_SERVICE_ID',
                columnNames: ['email', 'service_id'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove o índice único
        await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL_SERVICE_ID');

        // Remove a FK
        await queryRunner.query(
            `ALTER TABLE users DROP CONSTRAINT fk_users_service_id`,
        );

        // Remove a coluna service_id
        await queryRunner.dropColumn('users', 'service_id');

        // Restaura o constraint UNIQUE de email
        await queryRunner.query(
            `ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)`,
        );
    }
}

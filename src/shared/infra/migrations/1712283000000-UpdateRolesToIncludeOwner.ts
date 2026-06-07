import { MigrationInterface, QueryRunner } from 'typeorm';
import { uuidv7 } from 'uuidv7';

export class UpdateRolesToIncludeOwner1712283000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se OWNER já existe
        const ownerExists = await queryRunner.query(
            `SELECT id FROM roles WHERE id_num = 1 AND name = 'OWNER'`,
        );

        if (ownerExists.length > 0) {
            console.log('⊘ Role OWNER já existe');
            return;
        }

        // Desabilitar triggers de usuário para evitar violação de constraint.
        // USER (não ALL): ALL inclui os triggers de sistema das FKs, cuja
        // desativação exige superuser — e a app roda como auth_app (não-super).
        await queryRunner.query(`ALTER TABLE user_roles DISABLE TRIGGER USER`);

        try {
            // Renumera os roles existentes
            await queryRunner.query(
                `UPDATE roles SET id_num = id_num + 1 WHERE id_num >= 1`,
            );

            // Insere o novo role OWNER
            const ownerId = uuidv7();

            await queryRunner.query(
                `INSERT INTO roles (id, id_num, name, description, created_at, updated_at)
                 VALUES ($1, 1, 'OWNER', 'Proprietário do serviço', NOW(), NOW())`,
                [ownerId],
            );

            // Atualiza user_roles para refletir a nova numeração
            await queryRunner.query(
                `UPDATE user_roles SET role_id_num = role_id_num + 1 WHERE role_id_num >= 1`,
            );

            console.log('✓ Role OWNER criado e outros roles renumerados');
        } finally {
            // Reabilitar triggers
            await queryRunner.query(`ALTER TABLE user_roles ENABLE TRIGGER USER`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Desabilitar triggers de usuário (USER, não ALL — ver nota no up())
        await queryRunner.query(`ALTER TABLE user_roles DISABLE TRIGGER USER`);

        try {
            // Remove o role OWNER
            await queryRunner.query(`DELETE FROM roles WHERE name = 'OWNER'`);

            // Renumera os roles de volta
            await queryRunner.query(
                `UPDATE user_roles SET role_id_num = role_id_num - 1 WHERE role_id_num > 1`,
            );

            await queryRunner.query(
                `UPDATE roles SET id_num = id_num - 1 WHERE id_num > 1`,
            );
        } finally {
            // Reabilitar triggers
            await queryRunner.query(`ALTER TABLE user_roles ENABLE TRIGGER USER`);
        }
    }
}

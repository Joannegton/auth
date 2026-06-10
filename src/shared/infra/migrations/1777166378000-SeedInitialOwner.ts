import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

export class SeedInitialOwner1777166378000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const email = process.env.INITIAL_OWNER_EMAIL;
        const password = process.env.INITIAL_OWNER_PASSWORD;
        const name = process.env.INITIAL_OWNER_NAME || 'Platform Owner';

        if (!email || !password) {
            console.log(
                '⊘ SeedInitialOwner: INITIAL_OWNER_EMAIL/PASSWORD não definidos — pulando.',
            );
            return;
        }

        const countResult: { count: string }[] = await queryRunner.query(
            'SELECT COUNT(*) AS count FROM users',
        );
        if (parseInt(countResult[0].count) > 0) {
            console.log(
                `⊘ SeedInitialOwner: já existem usuários no sistema — pulando.`,
            );
            return;
        }

        const services: { id: string }[] = await queryRunner.query(
            `SELECT id FROM services WHERE name = $1`,
            ['auth-service'],
        );
        if (!services.length) {
            console.error('✗ SeedInitialOwner: auth-service não encontrado.');
            return;
        }
        const serviceId = services[0].id;

        const roles: { id: string; id_num: number }[] = await queryRunner.query(
            `SELECT id, id_num FROM roles WHERE id_num = $1`,
            [1],
        );
        if (!roles.length) {
            console.error('✗ SeedInitialOwner: role OWNER (id_num=1) não encontrada.');
            return;
        }
        const ownerRole = roles[0];

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv7();
        const userRoleId = uuidv7();

        await queryRunner.query(
            `INSERT INTO users (id, email, name, password, provider, service_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, 'local', $5, NOW(), NOW())`,
            [userId, email.trim().toLowerCase(), name, hashedPassword, serviceId],
        );

        await queryRunner.query(
            `INSERT INTO user_roles (id, user_id, role_id, role_id_num, service_id, assigned_at, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [userRoleId, userId, ownerRole.id, ownerRole.id_num, serviceId],
        );

        console.log(`✓ SeedInitialOwner: OWNER criado — ${email}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const email = process.env.INITIAL_OWNER_EMAIL;
        if (!email) return;

        await queryRunner.query(
            `DELETE FROM users WHERE email = $1`,
            [email.trim().toLowerCase()],
        );
        console.log(`✓ SeedInitialOwner revertida: usuário ${email} removido.`);
    }
}

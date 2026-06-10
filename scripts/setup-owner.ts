import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth_db',
    synchronize: false,
    logging: false,
});

async function main() {
    const email = process.env.INITIAL_OWNER_EMAIL; 
    const password = process.env.INITIAL_OWNER_PASSWORD;
    const name = process.env.INITIAL_OWNER_NAME || 'Platform Owner';

    if (!email || !password) {
        console.error('✗ Defina INITIAL_OWNER_EMAIL e INITIAL_OWNER_PASSWORD no .env');
        process.exit(1);
    }

    await dataSource.initialize();

    const [{ count }] = await dataSource.query<[{ count: string }]>(
        'SELECT COUNT(*) AS count FROM users',
    );
    if (parseInt(count) > 0) {
        console.error(`✗ Já existe(m) ${count} usuário(s) no sistema. Abortando.`);
        await dataSource.destroy();
        process.exit(1);
    }

    const services = await dataSource.query<{ id: string }[]>(
        `SELECT id FROM services WHERE name = $1`,
        ['auth-service'],
    );
    if (!services.length) {
        console.error('✗ auth-service não encontrado. Execute as migrations primeiro.');
        await dataSource.destroy();
        process.exit(1);
    }
    const serviceId = services[0].id;

    const roles = await dataSource.query<{ id: string; id_num: number }[]>(
        `SELECT id, id_num FROM roles WHERE id_num = $1`,
        [1],
    );
    if (!roles.length) {
        console.error('✗ Role OWNER (id_num=1) não encontrada. Execute as migrations primeiro.');
        await dataSource.destroy();
        process.exit(1);
    }
    const ownerRole = roles[0];

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv7();
    const userRoleId = uuidv7();

    await dataSource.query(
        `INSERT INTO users (id, email, name, password, provider, service_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'local', $5, NOW(), NOW())`,
        [userId, email.trim().toLowerCase(), name, hashedPassword, serviceId],
    );

    await dataSource.query(
        `INSERT INTO user_roles (id, user_id, role_id, role_id_num, service_id, assigned_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userRoleId, userId, ownerRole.id, ownerRole.id_num, serviceId],
    );

    console.log(`✓ OWNER criado com sucesso: ${email}`);
    console.log(`  userId: ${userId}`);
    console.log(`  serviceId: ${serviceId}`);

    await dataSource.destroy();
    process.exit(0);
}

main().catch((err) => {
    console.error('✗ Erro inesperado:', err.message);
    process.exit(1);
});

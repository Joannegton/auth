import { MigrationInterface, QueryRunner } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { randomBytes } from 'crypto';

export class SeedAuthService1712282850000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se serviço já existe
        const exists = await queryRunner.query(
            `SELECT id FROM services WHERE name = $1`,
            ['auth-service'],
        );

        if (exists.length === 0) {
            const serviceId = uuidv7();
            const apiKey = randomBytes(32).toString('hex');

            await queryRunner.query(
                `INSERT INTO services (id, name, api_key, created_at) VALUES ($1, $2, $3, NOW())`,
                [serviceId, 'auth-service', apiKey],
            );
            console.log('✓ Auth service criado');
        } else {
            console.log('⊘ Auth service já existe');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM services WHERE name = $1`, [
            'auth-service',
        ]);
    }
}

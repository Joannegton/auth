import { MigrationInterface, QueryRunner } from 'typeorm';
import { uuidv7 } from 'uuidv7';

export class SeedClientRole1777166377000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const exists = await queryRunner.query(
            'SELECT id FROM roles WHERE id_num = $1',
            [7],
        );

        if (exists.length === 0) {
            const clientId = uuidv7();
            await queryRunner.query(
                `INSERT INTO roles (id, id_num, name, description, created_at, updated_at)
                 VALUES ($1, 7, 'client', 'Cliente - Usuário padrão dos serviços', now(), now())`,
                [clientId],
            );
        } else {
            console.log('⊘ Role CLIENT já existe');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM roles WHERE id_num = 7');
    }
}

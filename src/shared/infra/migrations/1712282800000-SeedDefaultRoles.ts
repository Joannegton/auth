import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para criar roles padrão do sistema
 *
 * Executa automaticamente junto com outras migrations
 * Idempotente: se já existir, não duplica
 *
 * PK composta: (id UUID, id_num SMALLINT)
 * id_num (1-5) identifica a role no RBAC
 */
export class SeedDefaultRoles1712282800000 implements MigrationInterface {
    private readonly RoleEnum = {
        ADMIN: 1,
        MODERATOR: 2,
        USER: 3,
        GUEST: 4,
        BANNED: 5,
    };

    private readonly RoleData = {
        1: {
            name: 'admin',
            description: 'Administrador - Acesso total ao sistema',
        },
        2: {
            name: 'moderator',
            description: 'Moderador - Revisão e gestão de conteúdo',
        },
        3: {
            name: 'user',
            description: 'Usuário - Acesso padrão',
        },
        4: {
            name: 'guest',
            description: 'Convidado - Acesso limitado',
        },
        5: {
            name: 'banned',
            description: 'Banido - Sem acesso',
        },
    } as const;

    public async up(queryRunner: QueryRunner): Promise<void> {
        const roleIds = Object.values(this.RoleEnum) as number[];

        for (const roleIdNum of roleIds) {
            // Verificar se role já existe
            const exists = await queryRunner.query(
                'SELECT id FROM roles WHERE id_num = $1',
                [roleIdNum],
            );

            if (exists.length === 0) {
                const roleData = this.RoleData[roleIdNum as keyof typeof this.RoleData];
                console.log(`✓ Inserindo role: ${roleData.name} (ID num: ${roleIdNum})`);
                await queryRunner.query(
                    `INSERT INTO roles (id, id_num, name, description, created_at, updated_at)
                     VALUES (gen_random_uuid(), $1, $2, $3, now(), now())`,
                    [roleIdNum, roleData.name, roleData.description],
                );
            } else {
                const roleData = this.RoleData[roleIdNum as keyof typeof this.RoleData];
                console.log(`⊘ Role já existe: ${roleData.name}`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover todas as roles padrão (id_num 1-5)
        await queryRunner.query(
            'DELETE FROM roles WHERE id_num IN (1, 2, 3, 4, 5)',
        );
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

const ROLES_UPDATE = [
    {
        idNum: 1,
        name: 'owner',
        description:
            'Proprietário da plataforma. Criado internamente. Acesso irrestrito a qualquer serviceId. Único que pode criar outros owners.',
    },
    {
        idNum: 2,
        name: 'admin',
        description:
            'Administrador de um serviço. Gerencia workers, conteúdo e clientes dentro do seu serviceId. Ex: dono de salão no Beleze.',
    },
    {
        idNum: 3,
        name: 'moderator',
        description:
            'Supervisor do serviço. Pode criar e gerenciar workers, guests e clients dentro do serviceId. Ex: gerente de salão.',
    },
    {
        idNum: 4,
        name: 'worker',
        description:
            'Colaborador operacional. Executa tarefas do serviço sem poder gerenciar outros usuários. Ex: profissional de salão no Beleze.',
    },
    {
        idNum: 5,
        name: 'guest',
        description:
            'Acesso limitado de leitura. Não pode criar outros usuários. Uso opcional por serviços que precisam de acesso temporário ou de demonstração.',
    },
    {
        idNum: 6,
        name: 'banned',
        description:
            'Acesso revogado. Token ainda pode estar ativo até expirar, mas guards que checam esta role devem rejeitar a requisição.',
    },
    {
        idNum: 7,
        name: 'client',
        description:
            'Usuário final do serviço. Criado via registro público sem autenticação. Ex: cliente que agenda pelo Beleze.',
    },
];

export class UpdateRoleNamesAndDescriptions1749300000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const role of ROLES_UPDATE) {
            const [current] = await queryRunner.query(
                'SELECT name, description FROM roles WHERE id_num = $1',
                [role.idNum],
            );

            if (!current) {
                console.log(`⊘ Role idNum=${role.idNum} não encontrada, pulando.`);
                continue;
            }

            if (
                current.name === role.name &&
                current.description === role.description
            ) {
                console.log(`⊘ Role idNum=${role.idNum} já está atualizada.`);
                continue;
            }

            await queryRunner.query(
                `UPDATE roles SET name = $1, description = $2, updated_at = now() WHERE id_num = $3`,
                [role.name, role.description, role.idNum],
            );
            console.log(`✓ Role idNum=${role.idNum} atualizada: ${current.name} → ${role.name}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const original = [
            { idNum: 1, name: 'OWNER', description: 'Proprietário do serviço' },
            { idNum: 2, name: 'admin', description: 'Administrador - Acesso total ao sistema' },
            { idNum: 3, name: 'moderator', description: 'Moderador - Revisão e gestão de conteúdo' },
            { idNum: 4, name: 'user', description: 'Usuário - Acesso padrão' },
            { idNum: 5, name: 'guest', description: 'Convidado - Acesso limitado' },
            { idNum: 6, name: 'banned', description: 'Banido - Sem acesso' },
            { idNum: 7, name: 'client', description: 'Cliente - Usuário padrão dos serviços' },
        ];
        for (const role of original) {
            await queryRunner.query(
                `UPDATE roles SET name = $1, description = $2, updated_at = now() WHERE id_num = $3`,
                [role.name, role.description, role.idNum],
            );
        }
    }
}

/**
 * Tipos e constantes de roles da aplicação
 */

export enum ROLES {
    OWNER = 1,
    ADMIN = 2,
    MODERATOR = 3,
    WORKER = 4,
    GUEST = 5,
    BANNED = 6,
    CLIENT = 7,
}

export type RoleId = ROLES;

export const ROLE_NAMES: Record<ROLES, string> = {
    [ROLES.OWNER]: 'Proprietário',
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.MODERATOR]: 'Moderador',
    [ROLES.WORKER]: 'Trabalhador',
    [ROLES.GUEST]: 'Convidado',
    [ROLES.BANNED]: 'Banido',
    [ROLES.CLIENT]: 'Cliente',
};

export const ROLE_DESCRIPTIONS: Record<ROLES, string> = {
    [ROLES.OWNER]: 'Proprietário da plataforma. Criado internamente. Acesso irrestrito a qualquer serviceId. Único que pode criar outros owners.',
    [ROLES.ADMIN]: 'Administrador de um serviço. Gerencia workers, conteúdo e clientes dentro do seu serviceId. Ex: dono de salão no Beleze.',
    [ROLES.MODERATOR]: 'Supervisor do serviço. Pode criar e gerenciar workers, guests e clients dentro do serviceId. Ex: gerente de salão.',
    [ROLES.WORKER]: 'Colaborador operacional. Executa tarefas do serviço sem poder gerenciar outros usuários. Ex: profissional de salão no Beleze.',
    [ROLES.GUEST]: 'Acesso limitado de leitura. Não pode criar outros usuários. Uso opcional por serviços que precisam de acesso temporário ou de demonstração.',
    [ROLES.BANNED]: 'Acesso revogado. Token ainda pode estar ativo até expirar, mas guards que checam esta role devem rejeitar a requisição.',
    [ROLES.CLIENT]: 'Usuário final do serviço. Criado via registro público sem autenticação. Ex: cliente que agenda pelo Beleze.',
};

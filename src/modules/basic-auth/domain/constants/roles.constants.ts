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
    [ROLES.OWNER]: 'Proprietário do serviço',
    [ROLES.ADMIN]: 'Acesso total ao sistema',
    [ROLES.MODERATOR]: 'Pode gerenciar conteúdo e usuários',
    [ROLES.WORKER]: 'Trabalhador com permissões específicas',
    [ROLES.GUEST]: 'Acesso limitado de convidado',
    [ROLES.BANNED]: 'Usuário banido do sistema',
    [ROLES.CLIENT]: 'Cliente - Usuário padrão dos serviços',
};

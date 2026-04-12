/**
 * Tipos e constantes de roles da aplicação
 */

export enum ROLES {
    ADMIN = 1,
    MODERATOR = 2,
    USER = 3,
    GUEST = 4,
    BANNED = 5,
}

export type RoleId = ROLES;

export const ROLE_NAMES: Record<ROLES, string> = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.MODERATOR]: 'Moderador',
    [ROLES.USER]: 'Usuário',
    [ROLES.GUEST]: 'Convidado',
    [ROLES.BANNED]: 'Banido',
};

export const ROLE_DESCRIPTIONS: Record<ROLES, string> = {
    [ROLES.ADMIN]: 'Acesso total ao sistema',
    [ROLES.MODERATOR]: 'Pode gerenciar conteúdo e usuários',
    [ROLES.USER]: 'Usuário padrão com acesso completo',
    [ROLES.GUEST]: 'Acesso limitado de convidado',
    [ROLES.BANNED]: 'Usuário banido do sistema',
};

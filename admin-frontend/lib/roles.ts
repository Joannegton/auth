// Mapa de roles espelhando src/modules/basic-auth/domain/constants/roles.constants.ts do backend

export enum Role {
  OWNER = 1,
  ADMIN = 2,
  MODERATOR = 3,
  WORKER = 4,
  GUEST = 5,
  BANNED = 6,
  CLIENT = 7,
}

export const ROLE_NAMES: Record<number, string> = {
  [Role.OWNER]: "Proprietário",
  [Role.ADMIN]: "Administrador",
  [Role.MODERATOR]: "Moderador",
  [Role.WORKER]: "Trabalhador",
  [Role.GUEST]: "Convidado",
  [Role.BANNED]: "Banido",
  [Role.CLIENT]: "Cliente",
}

export const ROLE_DESCRIPTIONS: Record<number, string> = {
  [Role.OWNER]:
    "Proprietário da plataforma. Acesso irrestrito a qualquer serviceId. Único que pode criar outros owners.",
  [Role.ADMIN]:
    "Administrador de um serviço. Gerencia workers, conteúdo e clientes dentro do seu serviceId.",
  [Role.MODERATOR]:
    "Supervisor do serviço. Pode criar e gerenciar workers, guests e clients dentro do serviceId.",
  [Role.WORKER]:
    "Colaborador operacional. Executa tarefas do serviço sem poder gerenciar outros usuários.",
  [Role.GUEST]:
    "Acesso limitado de leitura. Não pode criar outros usuários. Uso temporário ou de demonstração.",
  [Role.BANNED]:
    "Acesso revogado. Guards que checam esta role devem rejeitar a requisição.",
  [Role.CLIENT]:
    "Usuário final do serviço. Criado via registro público sem autenticação.",
}

// Roles que podem acessar o painel de gestão
export const MANAGEMENT_ROLES = [Role.OWNER, Role.ADMIN, Role.MODERATOR]

// Roles que cada perfil pode criar via /services/users e /auth/workers
export function assignableRoles(roles: number[]): Role[] {
  if (roles.includes(Role.OWNER)) {
    return [Role.OWNER, Role.ADMIN, Role.MODERATOR, Role.WORKER, Role.GUEST]
  }
  if (roles.includes(Role.ADMIN)) {
    return [Role.MODERATOR, Role.WORKER, Role.GUEST]
  }
  if (roles.includes(Role.MODERATOR)) {
    return [Role.WORKER, Role.GUEST]
  }
  return []
}

export function roleBadgeClass(role: number): string {
  switch (role) {
    case Role.OWNER:
      return "bg-primary/15 text-primary border-primary/30"
    case Role.ADMIN:
      return "bg-sky-500/15 text-sky-400 border-sky-500/30"
    case Role.MODERATOR:
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case Role.WORKER:
      return "bg-secondary text-secondary-foreground border-border"
    case Role.GUEST:
      return "bg-muted text-muted-foreground border-border"
    case Role.BANNED:
      return "bg-destructive/15 text-destructive border-destructive/30"
    case Role.CLIENT:
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

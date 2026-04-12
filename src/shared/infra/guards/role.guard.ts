import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    SetMetadata,
    UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
    RoleId,
    ROLE_NAMES,
} from 'src/modules/basic-auth/domain/constants/roles.constants';

/**
 * Guard para verificar roles de um usuário
 *
 * @example
 * @UseGuards(RoleGuard)
 * @RequireRoles(ROLES.ADMIN)
 * deleteUser() { ... }
 *
 * @example
 * @UseGuards(RoleGuard)
 * @RequireRoles(ROLES.ADMIN, ROLES.MODERATOR)
 * approveContent() { ... }
 */
@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Obter roles requeridas do decorator
        const requiredRoles = this.reflector.get<RoleId[]>(
            'require_roles',
            context.getHandler(),
        );

        // Se não há roles especificadas, permitir
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Obter request
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Usuário não autenticado
        if (!user) {
            throw new ForbiddenException('Autenticação necessária');
        }

        // Obter roles do usuário (assumindo que vêm do JWT/token)
        // Esperando um array de RoleIds (números)
        const userRoles: RoleId[] = user.roles || [];

        // Verificar se usuário tem pelo menos uma das roles requeridas
        const hasRequiredRole = requiredRoles.some((role) =>
            userRoles.includes(role),
        );

        if (!hasRequiredRole) {
            const roleNames = requiredRoles
                .map((roleId) => ROLE_NAMES[roleId] || `[Role desconhecida]`)
                .join(', ');

            throw new ForbiddenException(`Roles necessárias: ${roleNames}`);
        }

        return true;
    }
}

/**
 * Decorator para especificar roles requeridas
 *
 * @example
 * @RequireRoles(ROLES.ADMIN)
 * @RequireRoles(ROLES.ADMIN, ROLES.MODERATOR)
 */
export const RequireRoles = (...roles: RoleId[]) =>
    SetMetadata('require_roles', roles);

/**
 * Decorator que combina UseGuards + RequireRoles
 * Mais conciso para usar nos controllers
 *
 * @example
 * @UseRoleGuard(ROLES.ADMIN)
 * @UseRoleGuard(ROLES.ADMIN, ROLES.MODERATOR)
 */
export const UseRoleGuard = (...roles: RoleId[]) => {
    return (
        target: any,
        propertyKey?: string | symbol,
        descriptor?: PropertyDescriptor,
    ) => {
        // Aplicar o decorador UseGuards
        UseGuards(RoleGuard)(target, propertyKey as any, descriptor as any);
        // Aplicar o decorador RequireRoles
        RequireRoles(...roles)(target, propertyKey as any, descriptor as any);
        return descriptor;
    };
};

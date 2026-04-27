import { Injectable } from '@nestjs/common';
import { R, Result } from 'src/shared/domain/result';
import { UserRole } from '../user-role';
import { Role, ROLES } from '../role';
import { User } from '../user';
import { UserWithoutPermissionException } from '../exceptions/UserWithoutPermission.exception';
import { UserRoleException } from '../exceptions/user-role.exception';
import { CompositeId } from 'src/shared/domain/value-objects/composite-id.vo';
import { RolePk } from '../role-pk.vo';

/**
 * Regras de autorização (scoped a serviceId):
 * - OWNER: pode criar qualquer role menor (ADMIN, MODERATOR, WORKER, GUEST, BANNED, CLIENT)
 * - ADMIN: pode criar MODERATOR, WORKER, GUEST, BANNED, CLIENT
 * - MODERATOR: pode criar WORKER, GUEST, BANNED, CLIENT
 * - WORKER, GUEST, BANNED: não podem criar nada
 * - Sem autenticação: pode criar apenas CLIENT (role padrão)
 * - OWNER: apenas OWNER do auth-service pode criar outros OWNER
 */
@Injectable()
export class UserRoleAssignmentPolicy {
    assignRoleToNewUser(
        roleToAssign: Role,
        creator?: User,
        serviceId?: string,
    ): Result<UserWithoutPermissionException | UserRoleException, UserRole> {
        if (!roleToAssign) {
            return R.error(
                new UserRoleException('Role para atribuir é obrigatória'),
            );
        }

        const authResult = this.validateCreatorPermission(
            roleToAssign,
            creator,
            serviceId,
        );
        if (authResult.isErr()) {
            return R.error(authResult.error);
        }

        const userRoleResult = UserRole.create({
            role: roleToAssign,
        });

        if (userRoleResult.isErr()) {
            return R.error(userRoleResult.error);
        }

        return R.ok(userRoleResult.value);
    }

    private validateCreatorPermission(
        roleToCreate: Role,
        creator?: User,
        serviceId?: string,
    ): Result<UserWithoutPermissionException, void> {
        const roleToCreateId = roleToCreate.id as CompositeId<RolePk>;

        if (!creator) {
            // Sem autenticação, pode criar apenas CLIENT
            if (roleToCreateId.ids.idNum === ROLES.CLIENT) {
                return R.ok();
            }
            return R.error(
                new UserWithoutPermissionException(
                    'Sem autenticação, só é possível criar usuários com role CLIENT',
                ),
            );
        }

        // Validar que creator tem pelo menos uma role no serviceId
        const creatorRoleInService = creator.userRoleList.filter(
            (ur) => !serviceId || ur.serviceId === serviceId,
        );

        if (creatorRoleInService.length === 0) {
            return R.error(
                new UserWithoutPermissionException(
                    `Creator não tem role no serviço ${serviceId}`,
                ),
            );
        }

        const creatorHighestRole = creator.getHighestRole();
        if (creatorHighestRole.isErr()) {
            return R.error(
                new UserWithoutPermissionException(
                    'Creator deve ter uma role definida',
                ),
            );
        }

        const creatorRoleId = creatorHighestRole.value
            .id as CompositeId<RolePk>;

        // OWNER só pode criar OWNER se for OWNER do auth-service
        if (roleToCreateId.ids.idNum === ROLES.OWNER) {
            if (creatorRoleId.ids.idNum !== ROLES.OWNER) {
                return R.error(
                    new UserWithoutPermissionException(
                        'Apenas OWNER pode criar usuários com role OWNER',
                    ),
                );
            }

            const isAuthServiceOwner = creator.userRoleList.some(
                (ur) =>
                    ur.serviceId === 'auth-service' &&
                    (ur.role.id as CompositeId<RolePk>).ids.idNum ===
                        ROLES.OWNER,
            );

            if (!isAuthServiceOwner) {
                return R.error(
                    new UserWithoutPermissionException(
                        'Apenas OWNER do auth-service pode criar novos OWNER',
                    ),
                );
            }

            return R.ok();
        }

        // OWNER pode criar qualquer role menor
        if (creatorRoleId.ids.idNum === ROLES.OWNER) {
            if (roleToCreateId.ids.idNum > ROLES.OWNER) {
                return R.ok();
            }
        }

        // ADMIN pode criar roles menores
        if (creatorRoleId.ids.idNum === ROLES.ADMIN) {
            if (roleToCreateId.ids.idNum > ROLES.ADMIN) {
                return R.ok();
            }
            return R.error(
                new UserWithoutPermissionException(
                    'ADMIN só pode criar roles menores que ADMIN',
                ),
            );
        }

        // MODERATOR pode criar WORKER, GUEST, BANNED
        if (creatorRoleId.ids.idNum === ROLES.MODERATOR) {
            if (roleToCreateId.ids.idNum > ROLES.MODERATOR) {
                return R.ok();
            }
            return R.error(
                new UserWithoutPermissionException(
                    'MODERATOR só pode criar roles WORKER, GUEST ou BANNED',
                ),
            );
        }

        return R.error(
            new UserWithoutPermissionException(
                `Usuários com role ${creatorHighestRole.value.name} não podem criar outros usuários`,
            ),
        );
    }
}

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
 * Regras de autorização:
 * - ADMIN: pode criar qualquer role
 * - MODERATOR: só pode criar USER, GUEST, BANNED (roles com idNum > 2)
 * - USER, GUEST, BANNED: não podem criar nada
 * - Sem autenticação: pode criar apenas USER (role padrão)
 */
@Injectable()
export class UserRoleAssignmentPolicy {
    assignRoleToNewUser(
        roleToAssign: Role,
        creator?: User,
    ): Result<UserWithoutPermissionException | UserRoleException, UserRole> {
        if (!roleToAssign) {
            return R.error(
                new UserRoleException('Role para atribuir é obrigatória'),
            );
        }

        const authResult = this.validateCreatorPermission(
            roleToAssign,
            creator,
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
    ): Result<UserWithoutPermissionException, void> {
        const roleToCreateId = roleToCreate.id as CompositeId<RolePk>;
        if (!creator) {
            if (
                roleToCreateId.ids.idNum === ROLES.USER ||
                roleToCreateId.ids.idNum === ROLES.GUEST
            ) {
                return R.ok();
            }
            return R.error(
                new UserWithoutPermissionException(
                    'Sem autenticação, só é possível criar usuários com role USER ou GUEST',
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

        if (creatorRoleId.ids.idNum === ROLES.ADMIN) {
            return R.ok();
        }

        if (creatorRoleId.ids.idNum === ROLES.MODERATOR) {
            if (roleToCreateId.ids.idNum > ROLES.MODERATOR) {
                return R.ok();
            }
            return R.error(
                new UserWithoutPermissionException(
                    'MODERATOR só pode criar usuários com roles USER, GUEST ou BANNED',
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

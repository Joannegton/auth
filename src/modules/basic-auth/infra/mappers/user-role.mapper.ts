import { R, Result } from 'src/shared/domain/result';
import { UserRole } from '../../domain/user-role';
import { UserRoleModel } from '../models/user-roles.model';
import { Injectable } from '@nestjs/common';
import { UserRoleException } from '../../domain/exceptions/user-role.exception';
import { RolePk } from '../../domain/role-pk.vo';
import { CompositeId } from 'src/shared/domain/value-objects/composite-id.vo';
import { RoleMapper } from './roles.mapper';

@Injectable()
export class UserRoleMapper {
    constructor(private readonly roleMapper: RoleMapper) {}

    toDomain(model: UserRoleModel): Result<UserRoleException, UserRole> {
        const role = this.roleMapper.toDomain(model.role);
        if (role.isErr()) return R.error(role.error);

        const userRole = UserRole.build(
            {
                userId: model.userId,
                role: role.value,
                assignedAt: model.assignedAt,
                serviceId: model.serviceId,
            },
            model.id,
        );

        if (userRole.isErr()) return R.error(userRole.error);

        return R.ok(userRole.value);
    }

    toModel(domain: UserRole): UserRoleModel {
        const roleId = domain.role.id as CompositeId<RolePk>;

        const model = UserRoleModel.build({
            id: domain.id.toString(),
            userId: domain.userId,
            roleId: roleId.ids.id,
            roleIdNum: roleId.ids.idNum,
            assignedAt: domain.assignedAt,
            serviceId: domain.serviceId,
        });
        return model;
    }

    toDomainList(
        models: UserRoleModel[],
    ): Result<UserRoleException, UserRole[]> {
        const userRoles: UserRole[] = [];
        for (const model of models) {
            const userRoleResult = this.toDomain(model);
            if (userRoleResult.isErr()) {
                return R.error(userRoleResult.error);
            }
            userRoles.push(userRoleResult.value);
        }
        return R.ok(userRoles);
    }

    toModelList(domains: UserRole[] | undefined): UserRoleModel[] {
        if (!domains) return [];
        return domains.map((domain) => this.toModel(domain));
    }
}

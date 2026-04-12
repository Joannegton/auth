import { R, Result } from 'src/shared/domain/result';
import { Role } from '../../domain/role';
import { RoleModel } from '../models/role.model';
import { Injectable } from '@nestjs/common';
import { RoleException } from '../../domain/exceptions/role.exception';
import { CompositeId } from 'src/shared/domain/value-objects/composite-id.vo';
import { RolePk } from '../../domain/role-pk.vo';

@Injectable()
export class RoleMapper {
    toDomain(model: RoleModel): Result<RoleException, Role> {
        const role = Role.build(
            {
                name: model.name,
                description: model.description,
                idNum: model.idNum,
            },
            model.id,
            model.idNum,
        );

        if (role.isErr()) return R.error(role.error);

        return R.ok(role.value);
    }

    toModel(domain: Role): RoleModel {
        const idComposto = domain.id as CompositeId<RolePk>;
        const model = RoleModel.build({
            id: idComposto.ids.id,
            idNum: idComposto.ids.idNum,
            name: domain.name,
            description: domain.description,
        });
        return model;
    }
}

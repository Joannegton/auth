import { R, Result } from 'src/shared/domain/result';
import { User } from '../../domain/user';
import { UserModel } from '../models/user.model';
import { Injectable } from '@nestjs/common';
import { UserException } from '../../domain/exceptions/user.exception';
import { UserRoleMapper } from './user-role.mapper';
import { SessionMapper } from './session.mapper';

@Injectable()
export class UserMapper {
    constructor(
        private readonly userRolesMapper: UserRoleMapper,
        private readonly sessionMapper: SessionMapper,
    ) {}

    toDomain(model: UserModel): Result<UserException, User> {
        const userRoles = this.userRolesMapper.toDomainList(model.roles);
        if (userRoles.isErr()) return R.error(userRoles.error);

        const sessions = this.sessionMapper.toDomainList(model.sessions);
        if (sessions.isErr()) return R.error(sessions.error);

        const user = User.build(
            {
                email: model.email,
                name: model.name,
                phone: model.phone,
                password: model.password,
                googleId: model.googleId,
                provider: model.provider,
                avatarUrl: model.avatarUrl,
                serviceId: model.serviceId,
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
                userRoles: userRoles.value,
                sessions: sessions.value,
            },
            model.id,
        );

        if (user.isErr()) return R.error(user.error);

        return R.ok(user.value);
    }

    toModel(domain: User): UserModel {
        const model = UserModel.build({
            id: domain.id.toString(),
            email: domain.email,
            name: domain.name,
            phone: domain.phone,
            password: domain.password,
            googleId: domain.googleId,
            provider: domain.provider,
            avatarUrl: domain.avatarUrl,
            serviceId: domain.serviceId,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            roles: this.userRolesMapper.toModelList(domain.userRoleList),
            sessions: this.sessionMapper.toModelList(domain.sessions),
        });
        return model;
    }
}

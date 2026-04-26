import { Inject, Injectable } from '@nestjs/common';
import {
    BusinessException,
    InvalidPropsException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import { R, ResultAsync } from 'src/shared/domain/result';
import { User } from '../../domain/user';
import { UserRoleAssignmentPolicy } from '../../domain/policies/user-role-assignment.policy';
import { InvalidPasswordException } from '../../domain/exceptions/invalidPassword.exception';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { IPasswordEncryptionService } from '../../domain/services/password-encryption.service';
import { PASSWORD_ENCRYPTION_SERVICE_TOKEN } from '../../domain/services/password-encryption.service';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { ROLES } from '../../domain/role';
import { CreateWorkerDto } from '../dtos/create-worker.dto';

export type CreateWorkerUseCaseExceptions =
    | InvalidPropsException
    | InvalidPasswordException
    | RepositoryNoDataFoundException
    | BusinessException;

export interface CreateWorkerResponse {
    id: string;
    email: string;
    serviceId: string;
}

@Injectable()
export class CreateWorkerUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
        private readonly userRoleAssignmentPolicy: UserRoleAssignmentPolicy,
        @Inject(PASSWORD_ENCRYPTION_SERVICE_TOKEN)
        private readonly passwordEncryptionService: IPasswordEncryptionService,
    ) {}

    async execute(
        props: CreateWorkerDto,
    ): ResultAsync<CreateWorkerUseCaseExceptions, CreateWorkerResponse> {
        const existingUserPromise = this.userRepository.findByEmailAndService(
            props.email.trim().toLowerCase(),
            props.serviceId,
        );

        const rolePromise = this.roleRepository.find(
            props.roleIdNum || ROLES.WORKER,
        );

        const creatorPromise = this.userRepository.findById(
            props.creatorUserId,
        );

        const [existingUser, roleResult, creatorResult] = await Promise.all([
            existingUserPromise,
            rolePromise,
            creatorPromise,
        ]);

        if (existingUser.isOk()) {
            return R.error(
                new BusinessException(
                    'Email já está em uso',
                    'EMAIL_ALREADY_EXISTS_IN_SERVICE',
                    409,
                ),
            );
        }

        if (
            existingUser.isErr() &&
            !(existingUser.error instanceof RepositoryNoDataFoundException)
        ) {
            return R.error(existingUser.error);
        }
        if (roleResult.isErr()) return R.error(roleResult.error);
        if (creatorResult.isErr()) return R.error(creatorResult.error);

        const userRoleAssignResult =
            this.userRoleAssignmentPolicy.assignRoleToNewUser(
                roleResult.value,
                creatorResult.value,
                props.serviceId,
            );
        if (userRoleAssignResult.isErr())
            return R.error(userRoleAssignResult.error);

        const hashedPassword =
            await this.passwordEncryptionService.hashPassword(props.password);

        const user = User.create({
            email: props.email,
            password: hashedPassword,
            provider: 'local',
            serviceId: props.serviceId,
            role: roleResult.value,
        });
        if (user.isErr()) return R.error(user.error);

        const saveResult = await this.userRepository.save(user.value);
        if (saveResult.isErr()) return R.error(saveResult.error);

        return R.ok({
            id: user.value.id.toString(),
            email: user.value.email,
            serviceId: user.value.serviceId,
        });
    }
}

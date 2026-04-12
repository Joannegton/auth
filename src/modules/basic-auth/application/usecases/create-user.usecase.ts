import { Inject } from '@nestjs/common';
import {
    BusinessException,
    InvalidPropsException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import { R, ResultAsync } from 'src/shared/domain/result';
import { User } from '../../domain/user';
import { PasswordValidatorPolicy } from '../../domain/policies/Password-validator.policy';
import { UserRoleAssignmentPolicy } from '../../domain/policies/user-role-assignment.policy';
import { CreateUserDto } from '../dtos/create-user.dto';
import { InvalidPasswordException } from '../../domain/exceptions/invalidPassword.exception';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { IPasswordEncryptionService } from '../../domain/services/password-encryption.service';
import { PASSWORD_ENCRYPTION_SERVICE_TOKEN } from '../../domain/services/password-encryption.service';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { ROLES } from '../../domain/role';

export type CreateUserUseCaseExceptions =
    | InvalidPropsException
    | InvalidPasswordException
    | RepositoryNoDataFoundException;

export class CreateUserUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
        private readonly passwordValidatorPolicy: PasswordValidatorPolicy,
        private readonly userRoleAssignmentPolicy: UserRoleAssignmentPolicy,
        @Inject(PASSWORD_ENCRYPTION_SERVICE_TOKEN)
        private readonly passwordEncryptionService: IPasswordEncryptionService,
    ) {}

    async execute(
        props: CreateUserDto,
    ): ResultAsync<CreateUserUseCaseExceptions, void> {
        const existingUserPromise = this.userRepository.findByEmail(
            props.email.trim().toLowerCase(),
        );
        const rolePromise = this.roleRepository.find(
            props.roleIdNum || ROLES.USER,
        );
        const creatorPromise = props.creatorUserId
            ? this.userRepository.findById(props.creatorUserId)
            : Promise.resolve(null);

        const [existingUser, roleResult, creatorResult] = await Promise.all([
            existingUserPromise,
            rolePromise,
            creatorPromise,
        ]);

        if (existingUser.isOk())
            return R.error(
                new BusinessException(
                    'Email já está em uso',
                    'EMAIL_ALREADY_EXISTS',
                    409,
                ),
            );

        if (
            existingUser.isErr() &&
            !(existingUser.error instanceof RepositoryNoDataFoundException)
        ) {
            return R.error(existingUser.error);
        }

        if (roleResult.isErr()) return R.error(roleResult.error);

        const passwordValidation = this.passwordValidatorPolicy.execute(
            props.password,
        );
        if (passwordValidation.isErr())
            return R.error(passwordValidation.error);

        let creator: User | undefined;
        if (props.creatorUserId) {
            if (creatorResult?.isErr()) return R.error(creatorResult.error);

            if (!creatorResult || creatorResult.isErr())
                return R.error(
                    creatorResult?.error ||
                        new BusinessException('Criador não encontrado'),
                );
            creator = creatorResult.value;
        }

        const userRoleAssignResult =
            this.userRoleAssignmentPolicy.assignRoleToNewUser(
                roleResult.value,
                creator,
            );
        if (userRoleAssignResult.isErr())
            return R.error(userRoleAssignResult.error);

        const hashedPassword =
            await this.passwordEncryptionService.hashPassword(props.password);

        const user = User.create({
            email: props.email,
            password: hashedPassword,
            provider: 'local',
            role: roleResult.value,
        });
        if (user.isErr()) return R.error(user.error);

        const saveResult = await this.userRepository.save(user.value);
        if (saveResult.isErr()) return R.error(saveResult.error);

        return R.ok();
    }
}

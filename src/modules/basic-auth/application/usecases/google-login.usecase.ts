import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository';
import {
    TokenGeneratorServiceImpl,
    AuthTokens,
} from '../../infra/services/token-generator.service';
import { AuditLogService } from '../../../../shared/infra/services/audit-log.service';
import { R, ResultAsync } from '../../../../shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from '../../../../shared/domain/exceptions';
import { User } from '../../domain/user';
import { ROLES } from '../../domain/role';
import type { RoleRepository } from '../../domain/repositories/role.repository';

export interface GoogleLoginInput {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

export type GenerateTokens = AuthTokens & { refreshExpiresIn: number };

export type GoogleLoginUseCaseExceptions =
    | RepositoryException
    | RepositoryNoDataFoundException;

@Injectable()
export class GoogleLoginUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
        private readonly tokenGenerator: TokenGeneratorServiceImpl,
        private readonly auditLog: AuditLogService,
    ) {}

    async execute(
        props: GoogleLoginInput,
        ipAddress: string = 'unknown',
        userAgent: string = 'unknown',
    ): ResultAsync<GoogleLoginUseCaseExceptions, AuthTokens> {
        const userGoogle = await this.userRepository.findByGoogleId(
            props.googleId,
        );

        if (userGoogle.isOk()) {
            await this.auditLog.logLoginSuccess(
                userGoogle.value.id.toString(),
                ipAddress,
                userAgent,
            );
            return await this.generatesSessionAndTokens(
                userGoogle.value,
                ipAddress,
                userAgent,
            );
        }

        const user = await this.userRepository.findByEmail(props.email);

        if (user.isOk()) {
            user.value.addGoogleInfo(props.googleId, props.avatarUrl);

            const saveResult = await this.userRepository.save(user.value);
            if (saveResult.isErr()) {
                return R.error(
                    new RepositoryException('Erro ao atualizar usuário'),
                );
            }

            await this.auditLog.logLoginSuccess(
                user.value.id.toString(),
                ipAddress,
                userAgent,
            );
            return await this.generatesSessionAndTokens(
                user.value,
                ipAddress,
                userAgent,
            );
        }

        const role = await this.roleRepository.find(ROLES.USER);
        if (role.isErr()) return R.error(role.error);

        const newUser = User.create({
            email: props.email,
            googleId: props.googleId,
            provider: 'google',
            avatarUrl: props.avatarUrl,
            role: role.value,
        });
        if (newUser.isErr()) return R.error(newUser.error);

        return await this.generatesSessionAndTokens(
            newUser.value,
            ipAddress,
            userAgent,
        );
    }

    private async generatesSessionAndTokens(
        user: User,
        ipAddress: string,
        userAgent: string,
    ): ResultAsync<GoogleLoginUseCaseExceptions, AuthTokens> {
        const tokens = this.tokenGenerator.generateTokens(
            user.id.toString(),
            user.email,
        );

        const addSession = user.addSession({
            refreshToken: tokens.refreshToken,
            expiresAt: this.tokenGenerator.getRefreshTokenExpiryDays(),
        });
        if (addSession.isErr()) return R.error(addSession.error);

        const saved = await this.userRepository.save(user);
        if (saved.isErr()) return R.error(saved.error);

        await this.auditLog.logLoginSuccess(
            user.id.toString(),
            ipAddress,
            userAgent,
        );

        return R.ok(tokens);
    }
}

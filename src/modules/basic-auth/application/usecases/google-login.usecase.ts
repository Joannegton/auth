import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { RequestInfo } from '../../domain/decorators/extract-request-info.decorator';
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

export interface GoogleLoginInput {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

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
        requestInfo: RequestInfo,
    ): ResultAsync<GoogleLoginUseCaseExceptions, AuthTokens> {
        const userGoogle = await this.userRepository.findByGoogleId(
            props.googleId,
        );

        if (userGoogle.isOk()) {
            return await this.generatesSessionAndTokens(
                userGoogle.value,
                requestInfo,
            );
        }

        const user = await this.userRepository.findByEmail(props.email);

        if (user.isOk()) {
            user.value.addGoogleInfo(props.googleId, props.avatarUrl);

            const saveResult = await this.userRepository.save(user.value);
            if (saveResult.isErr()) return R.error(saveResult.error);

            return await this.generatesSessionAndTokens(
                user.value,
                requestInfo,
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

        return await this.generatesSessionAndTokens(newUser.value, requestInfo);
    }

    private async generatesSessionAndTokens(
        user: User,
        requestInfo: RequestInfo,
    ): ResultAsync<GoogleLoginUseCaseExceptions, AuthTokens> {
        const { ipAddress, userAgent } = requestInfo;

        const tokens = this.tokenGenerator.generateTokens(
            user.id.toString(),
            user.email,
        );

        const addSession = user.addSession({
            refreshToken: tokens.refreshToken,
            expiresAt: this.tokenGenerator.getRefreshTokenExpiryDays(),
            userAgent: userAgent,
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

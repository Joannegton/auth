import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { IPasswordEncryptionService } from '../../domain/services/password-encryption.service';
import { PASSWORD_ENCRYPTION_SERVICE_TOKEN } from '../../domain/services/password-encryption.service';
import {
    TokenGeneratorServiceImpl,
    AuthTokens,
} from '../../infra/services/token-generator.service';
import type { RequestInfo } from '../../domain/decorators/extract-request-info.decorator';
import { AuditLogService } from '../../../../shared/infra/services/audit-log.service';
import { R, ResultAsync } from '../../../../shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from '../../../../shared/domain/exceptions';

export interface LoginProps {
    email: string;
    password: string;
    infinitySession?: boolean;
}

export type LoginUseCaseExceptions =
    | RepositoryException
    | RepositoryNoDataFoundException;

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        private readonly tokenGenerator: TokenGeneratorServiceImpl,
        private readonly auditLog: AuditLogService,
        @Inject(PASSWORD_ENCRYPTION_SERVICE_TOKEN)
        private readonly passwordEncryptionService: IPasswordEncryptionService,
    ) {}

    async execute(
        props: LoginProps,
        requestInfo: RequestInfo,
    ): ResultAsync<LoginUseCaseExceptions, AuthTokens> {
        const { ipAddress, userAgent } = requestInfo;

        const user = await this.userRepository.findByEmail(
            props.email.toLowerCase().trim(),
        );

        if (user.isErr()) {
            await this.auditLog.logLoginFailure(
                props.email,
                ipAddress,
                userAgent,
                'User not found',
            );
            return R.error(new RepositoryException('email ou senha inválidos'));
        }

        if (!user.value.password) {
            await this.auditLog.logLoginFailure(
                props.email,
                ipAddress,
                userAgent,
                'User has no password',
            );
            return R.error(
                new RepositoryException(
                    'Usuario não possui senha, tente com o google',
                ),
            );
        }

        const passwordMatch =
            await this.passwordEncryptionService.comparePassword(
                props.password,
                user.value.password,
            );

        if (!passwordMatch) {
            await this.auditLog.logLoginFailure(
                props.email,
                ipAddress,
                userAgent,
                'Invalid password',
            );
            return R.error(new RepositoryException('email ou senha inválidos'));
        }

        const tokens = this.tokenGenerator.generateTokens(
            user.value.id.toString(),
            user.value.email,
        );

        const addSession = user.value.addSession({
            refreshToken: tokens.refreshToken,
            expiresAt: this.tokenGenerator.getRefreshTokenExpiryDays(),
            userAgent: userAgent,
            infinity: props.infinitySession,
        });

        if (addSession.isErr()) return R.error(addSession.error);

        await this.auditLog.logLoginSuccess(
            user.value.id.toString(),
            ipAddress,
            userAgent,
        );

        return R.ok(tokens);
    }
}

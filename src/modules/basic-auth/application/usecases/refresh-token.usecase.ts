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
import { SessionInvalidException } from '../../domain/exceptions/session-invalid.exception';
import { UserException } from '../../domain/exceptions/user.exception';

export interface RefreshTokenInput {
    refreshToken: string;
    userAgent?: string;
}

export type RefreshTokenUseCaseExceptions =
    | RepositoryException
    | RepositoryNoDataFoundException
    | SessionInvalidException
    | UserException;

@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('TokenGenerator')
        private readonly tokenGenerator: TokenGeneratorServiceImpl,
        private readonly auditLog: AuditLogService,
    ) {}

    async execute(
        props: RefreshTokenInput,
    ): ResultAsync<RefreshTokenUseCaseExceptions, AuthTokens> {
        const payload = this.tokenGenerator.verifyToken(props.refreshToken);
        if (payload.isErr()) return R.error(payload.error);

        const user = await this.userRepository.findById(payload.value.sub);
        if (user.isErr()) return R.error(user.error);

        const isSessionValid = user.value.validateSession(props.refreshToken);
        if (!isSessionValid) {
            return R.error(new SessionInvalidException('Sessao invalida'));
        }

        const idsNumUserRoles = user.value.getIdsNumUserRolesService(
            payload.value.serviceId,
        );
        if (idsNumUserRoles.isErr()) return R.error(idsNumUserRoles.error);

        // Preserva o flag de sessão infinita antes de rotacionar, já que
        // addSession revoga as sessões válidas atuais.
        const currentSession = user.value.sessions?.find(
            (s) => s.refreshToken === props.refreshToken,
        );
        const wasInfinity = currentSession?.infinity ?? false;

        const tokens = this.tokenGenerator.generateTokens(
            user.value.id.toString(),
            user.value.email,
            user.value.serviceId,
            idsNumUserRoles.value,
            { name: user.value.name, phone: user.value.phone },
        );

        // Rotação de refresh token: revoga a sessão antiga e persiste a nova,
        // espelhando o LoginUseCase. Sem isso o banco continuaria apenas com o
        // refresh token anterior e o próximo refresh falharia com "Sessao invalida".
        const addSession = user.value.addSession({
            refreshToken: tokens.refreshToken,
            expiresAt: this.tokenGenerator.getRefreshTokenExpiryDays(),
            userAgent: props.userAgent,
            infinity: wasInfinity,
        });
        if (addSession.isErr()) return R.error(addSession.error);

        const saveResult = await this.userRepository.save(user.value);
        if (saveResult.isErr()) return R.error(saveResult.error);

        await this.auditLog.logTokenRefresh(
            user.value.id.toString(),
            'unknown',
            props.userAgent ?? 'unknown',
        );

        return R.ok(tokens);
    }
}

import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { AuditLogService } from '../../../../shared/infra/services/audit-log.service';
import { R, ResultAsync } from '../../../../shared/domain/result';
import { RepositoryException } from '../../../../shared/domain/exceptions';

export type LogoutUseCaseExceptions = RepositoryException;

@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        private readonly auditLog: AuditLogService,
    ) {}

    async execute(
        userId: string,
        req?: Request,
    ): ResultAsync<LogoutUseCaseExceptions, void> {
        const ipAddress = req?.ip || 'unknown';
        const userAgent = req?.get('user-agent') || 'unknown';

        const user = await this.userRepository.findById(userId);
        if (user.isErr()) {
            return R.error(user.error);
        }

        user.value.revokeSession();

        await this.auditLog.logLogout(
            user.value.id.toString(),
            ipAddress,
            userAgent,
        );

        return R.ok();
    }
}

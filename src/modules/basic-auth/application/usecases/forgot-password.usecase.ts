import { Inject, Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { R, ResultAsync } from 'src/shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import type { UserRepository } from '../../domain/repositories/user.repository';
import {
    PASSWORD_RESET_CODE_REPOSITORY,
    type PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';
import {
    PASSWORD_ENCRYPTION_SERVICE_TOKEN,
    type IPasswordEncryptionService,
} from '../../domain/services/password-encryption.service';
import {
    EMAIL_SERVICE_TOKEN,
    type IEmailService,
} from '../../domain/services/email.service';

const CODE_TTL_MINUTES = 15;

@Injectable()
export class ForgotPasswordUseCase {
    constructor(
        @Inject('UserRepository') private readonly userRepo: UserRepository,
        @Inject(PASSWORD_RESET_CODE_REPOSITORY)
        private readonly codeRepo: PasswordResetCodeRepository,
        @Inject(PASSWORD_ENCRYPTION_SERVICE_TOKEN)
        private readonly passwordService: IPasswordEncryptionService,
        @Inject(EMAIL_SERVICE_TOKEN)
        private readonly emailService: IEmailService,
    ) {}

    async execute(
        email: string,
        serviceId: string,
    ): ResultAsync<RepositoryException, void> {
        const normalizedEmail = email.trim().toLowerCase();
        const userResult = await this.userRepo.findByEmailAndService(
            normalizedEmail,
            serviceId,
        );

        if (userResult.isErr()) {
            if (userResult.error instanceof RepositoryNoDataFoundException) {
                return R.ok();
            }
            return R.error(userResult.error as RepositoryException);
        }

        const user = userResult.value;
        const code = randomInt(100000, 1000000).toString();
        const codeHash = await this.passwordService.hashPassword(code);

        await this.codeRepo.invalidateAllForUser(user.id.toString(), serviceId);
        const saveResult = await this.codeRepo.save({
            id: randomUUID(),
            userId: user.id.toString(),
            serviceId,
            codeHash,
            expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
        });
        if (saveResult.isErr()) return R.error(saveResult.error);

        await this.emailService.sendPasswordResetCode(user.email, code);
        return R.ok();
    }
}

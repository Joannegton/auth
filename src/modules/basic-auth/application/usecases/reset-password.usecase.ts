import { Inject, Injectable } from '@nestjs/common';
import { R, ResultAsync } from 'src/shared/domain/result';
import {
    BusinessException,
    RepositoryException,
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

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @Inject('UserRepository') private readonly userRepo: UserRepository,
        @Inject(PASSWORD_RESET_CODE_REPOSITORY)
        private readonly codeRepo: PasswordResetCodeRepository,
        @Inject(PASSWORD_ENCRYPTION_SERVICE_TOKEN)
        private readonly passwordService: IPasswordEncryptionService,
    ) {}

    async execute(
        email: string,
        serviceId: string,
        code: string,
        newPassword: string,
    ): ResultAsync<BusinessException | RepositoryException, void> {
        const invalid = new BusinessException(
            'Código inválido ou expirado',
            'INVALID_RESET_CODE',
            400,
        );

        const userResult = await this.userRepo.findByEmailAndService(
            email.trim().toLowerCase(),
            serviceId,
        );
        if (userResult.isErr()) return R.error(invalid);
        const user = userResult.value;

        const activeResult = await this.codeRepo.findLatestActive(
            user.id.toString(),
            serviceId,
        );
        if (activeResult.isErr()) return R.error(activeResult.error);
        const active = activeResult.value;
        if (!active) return R.error(invalid);

        const matches = await this.passwordService.comparePassword(
            code,
            active.codeHash,
        );
        if (!matches) return R.error(invalid);

        const newHash = await this.passwordService.hashPassword(newPassword);
        user.changePassword(newHash);
        user.revokeSession();

        const saveResult = await this.userRepo.save(user);
        if (saveResult.isErr()) {
            return R.error(saveResult.error as RepositoryException);
        }

        await this.codeRepo.markUsed(active.id);
        return R.ok();
    }
}

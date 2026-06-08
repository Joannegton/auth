import { Inject, Injectable, Logger } from '@nestjs/common';
import { R, ResultAsync } from 'src/shared/domain/result';
import { BusinessException } from 'src/shared/domain/exceptions';
import type { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteAccountUseCase {
    private readonly logger = new Logger(DeleteAccountUseCase.name);

    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
    ) {}

    async execute(userId: string): ResultAsync<BusinessException, void> {
        try {
            const result = await this.userRepository.softDeleteById(userId);
            if (result.isErr()) {
                return R.error(
                    new BusinessException(
                        'Não foi possível excluir a conta.',
                        'DELETE_ACCOUNT_FAILED',
                        500,
                    ),
                );
            }
            return R.ok();
        } catch (error) {
            this.logger.error(
                'Falha ao excluir conta',
                error instanceof Error ? error.message : String(error),
            );
            return R.error(
                new BusinessException(
                    'Não foi possível excluir a conta.',
                    'DELETE_ACCOUNT_FAILED',
                    500,
                ),
            );
        }
    }
}

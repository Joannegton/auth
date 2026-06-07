import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { R, ResultAsync } from 'src/shared/domain/result';
import { RepositoryException } from 'src/shared/domain/exceptions';
import { PasswordResetCodeModel } from '../models/password-reset-code.model';
import {
    NewPasswordResetCode,
    PasswordResetCodeData,
    PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';

@Injectable()
export class PasswordResetCodeRepositoryImpl
    implements PasswordResetCodeRepository
{
    private readonly logger = new Logger(PasswordResetCodeRepositoryImpl.name);

    constructor(
        @InjectRepository(PasswordResetCodeModel)
        private readonly repo: Repository<PasswordResetCodeModel>,
    ) {}

    async save(
        code: NewPasswordResetCode,
    ): ResultAsync<RepositoryException, void> {
        try {
            await this.repo.save({ ...code, usedAt: null });
            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao salvar código de reset', error);
            return R.error(new RepositoryException('Erro ao salvar código'));
        }
    }

    async findLatestActive(
        userId: string,
        serviceId: string,
    ): ResultAsync<RepositoryException, PasswordResetCodeData | null> {
        try {
            const model = await this.repo.findOne({
                where: {
                    userId,
                    serviceId,
                    usedAt: IsNull(),
                    expiresAt: MoreThan(new Date()),
                },
                order: { createdAt: 'DESC' },
            });
            return R.ok(model ?? null);
        } catch (error) {
            this.logger.error('Erro ao buscar código de reset', error);
            return R.error(new RepositoryException('Erro ao buscar código'));
        }
    }

    async markUsed(id: string): ResultAsync<RepositoryException, void> {
        try {
            await this.repo.update({ id }, { usedAt: new Date() });
            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao marcar código como usado', error);
            return R.error(new RepositoryException('Erro ao atualizar código'));
        }
    }

    async invalidateAllForUser(
        userId: string,
        serviceId: string,
    ): ResultAsync<RepositoryException, void> {
        try {
            await this.repo.update(
                { userId, serviceId, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
                { usedAt: new Date() },
            );
            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao invalidar códigos', error);
            return R.error(new RepositoryException('Erro ao invalidar códigos'));
        }
    }
}

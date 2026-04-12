import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SessionModel } from '../models/session.model';
import { R, ResultAsync } from 'src/shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import {
    SessionRepository,
    SessionData,
    CreateSessionInput,
    SessionRepositoryExceptions,
} from '../../domain/repositories/session.repository';

@Injectable()
export class SessionRepositoryImpl implements SessionRepository {
    private readonly logger = new Logger(SessionRepositoryImpl.name);

    constructor(
        @InjectRepository(SessionModel)
        private readonly sessionRepository: Repository<SessionModel>,
    ) {}

    /**
     * Criar nova sessão com refresh token
     *
     * Segurança:
     * - UUID gerado para session ID
     * - expiresAt é confirmado (7 dias padrão)
     * - User-Agent é armazenado para validação posterior
     */
    async create(
        input: CreateSessionInput,
    ): ResultAsync<SessionRepositoryExceptions, SessionData> {
        try {
            const sessionId = input.id || uuidv4();

            const session = this.sessionRepository.create({
                id: sessionId,
                refreshToken: input.refreshToken,
                userId: input.userId,
                expiresAt: input.expiresAt,
                userAgent: input.userAgent,
                isRevoked: false,
            });

            await this.sessionRepository.save(session);

            this.logger.debug(
                `Session created for user ${input.userId}, expires at ${input.expiresAt}`,
            );

            return R.ok(this.toSessionData(session));
        } catch (error) {
            this.logger.error('Error creating session', error);
            return R.error(
                new RepositoryException('Erro ao criar sessão'),
            );
        }
    }

    /**
     * Buscar sessão por refresh token
     */
    async findByRefreshToken(
        refreshToken: string,
    ): ResultAsync<SessionRepositoryExceptions, SessionData> {
        try {
            const session = await this.sessionRepository.findOne({
                where: { refreshToken },
                relations: ['user'],
            });

            if (!session) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Sessão não encontrada',
                    ),
                );
            }

            return R.ok(this.toSessionData(session));
        } catch (error) {
            this.logger.error('Error finding session by refresh token', error);
            return R.error(
                new RepositoryException('Erro ao buscar sessão'),
            );
        }
    }

    /**
     * Buscar sessão por ID
     */
    async findById(
        sessionId: string,
    ): ResultAsync<SessionRepositoryExceptions, SessionData> {
        try {
            const session = await this.sessionRepository.findOne({
                where: { id: sessionId },
                relations: ['user'],
            });

            if (!session) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Sessão não encontrada',
                    ),
                );
            }

            return R.ok(this.toSessionData(session));
        } catch (error) {
            this.logger.error('Error finding session by ID', error);
            return R.error(
                new RepositoryException('Erro ao buscar sessão por ID'),
            );
        }
    }

    /**
     * Revogar sessão específica (marca como isRevoked=true)
     *
     * Nota: Não deleta, apenas marca como revogada para auditoria
     */
    async revoke(
        sessionId: string,
    ): ResultAsync<SessionRepositoryExceptions, void> {
        try {
            await this.sessionRepository.update(
                { id: sessionId },
                { isRevoked: true },
            );

            this.logger.debug(`Session ${sessionId} revoked`);
            return R.ok();
        } catch (error) {
            this.logger.error('Error revoking session', error);
            return R.error(
                new RepositoryException('Erro ao revogar sessão'),
            );
        }
    }

    /**
     * Revogar todas as sessões de um usuário
     *
     * Segurança: Usado em logout para invalidar todos os dispositivos
     */
    async revokeAll(
        userId: string,
    ): ResultAsync<SessionRepositoryExceptions, void> {
        try {
            await this.sessionRepository.update(
                { userId },
                { isRevoked: true },
            );

            this.logger.debug(`All sessions revoked for user ${userId}`);
            return R.ok();
        } catch (error) {
            this.logger.error('Error revoking all sessions', error);
            return R.error(
                new RepositoryException('Erro ao revogar sessões'),
            );
        }
    }

    /**
     * Buscar todas as sessões ativas de um usuário
     *
     * Ativo = não revogada E não expirada
     */
    async findActiveSessions(
        userId: string,
    ): ResultAsync<SessionRepositoryExceptions, SessionData[]> {
        try {
            const now = new Date();

            const sessions = await this.sessionRepository.find({
                where: {
                    userId,
                    isRevoked: false,
                },
            });

            // Filter out expired sessions (double-check)
            const activeSessions = sessions.filter(
                (s) => s.expiresAt > now,
            );

            return R.ok(activeSessions.map((s) => this.toSessionData(s)));
        } catch (error) {
            this.logger.error(
                'Error finding active sessions for user',
                error,
            );
            return R.error(
                new RepositoryException('Erro ao buscar sessões ativas'),
            );
        }
    }

    /**
     * Verificar se sessão é válida
     *
     * Valido = exists + not revoked + not expired
     *
     * Segurança: Isso complementa a validação JWT
     * - JWT pode estar expirado mas o payload ainda decodificar
     * - Sessão no BD garante revogação imediata
     */
    async isValid(
        refreshToken: string,
    ): ResultAsync<SessionRepositoryExceptions, boolean> {
        try {
            const session = await this.sessionRepository.findOne({
                where: { refreshToken },
            });

            if (!session) {
                return R.ok(false);
            }

            const now = new Date();
            const isValid = !session.isRevoked && session.expiresAt > now;

            return R.ok(isValid);
        } catch (error) {
            this.logger.error('Error validating session', error);
            return R.error(
                new RepositoryException('Erro ao validar sessão'),
            );
        }
    }

    /**
     * Helper: Converter SessionModel para SessionData
     */
    private toSessionData(model: SessionModel): SessionData {
        return {
            id: model.id,
            refreshToken: model.refreshToken,
            userId: model.userId,
            expiresAt: model.expiresAt,
            isRevoked: model.isRevoked,
            userAgent: model.userAgent,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        };
    }
}

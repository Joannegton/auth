import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model';
import { SessionModel } from '../models/session.model';
import { UserRoleModel } from '../models/user-roles.model';
import { RoleModel } from '../models/role.model';
import { R, Result, ResultAsync } from 'src/shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../../domain/user';
import {
    UserRepository,
    UserRepositoryExceptions,
} from '../../domain/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
    private readonly logger = new Logger(UserRepositoryImpl.name);

    constructor(
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
        @InjectRepository(UserRoleModel)
        private readonly userRoleRepository: Repository<UserRoleModel>,
        @InjectRepository(RoleModel)
        private readonly roleRepository: Repository<RoleModel>,
        private readonly userMapper: UserMapper,
    ) {}

    async save(user: User): ResultAsync<RepositoryException, void> {
        try {
            const model = this.userMapper.toModel(user);

            await this.userRepository.save(model);

            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao salvar usuário', error);
            return R.error(new RepositoryException('Erro ao salvar usuário'));
        }
    }

    async findByEmail(
        email: string,
    ): ResultAsync<UserRepositoryExceptions, User> {
        try {
            const userModel = await this.userRepository.findOne({
                where: { email },
                relations: ['sessions', 'roles', 'roles.role'],
            });

            if (!userModel) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Usuário não encontrado',
                    ),
                );
            }

            const user = this.userMapper.toDomain(userModel);
            if (user.isErr()) return R.error(user.error);

            return R.ok(user.value);
        } catch (error) {
            this.logger.error('Erro ao buscar usuário por email', error);
            return R.error(
                new RepositoryException('Erro ao buscar usuário por email'),
            );
        }
    }

    async findById(id: string): ResultAsync<UserRepositoryExceptions, User> {
        try {
            const userModel = await this.userRepository.findOne({
                where: { id },
                relations: ['sessions', 'roles', 'roles.role'],
            });

            if (!userModel) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Usuário não encontrado',
                    ),
                );
            }

            const user = this.userMapper.toDomain(userModel);
            if (user.isErr()) return R.error(user.error);

            return R.ok(user.value);
        } catch (error) {
            this.logger.error('Erro ao buscar usuário por ID', error);
            return R.error(
                new RepositoryException('Erro ao buscar usuário por ID'),
            );
        }
    }

    async findByGoogleId(
        googleId: string,
    ): ResultAsync<UserRepositoryExceptions, User> {
        try {
            const userModel = await this.userRepository.findOne({
                where: { googleId },
                relations: ['sessions', 'roles', 'roles.role'],
            });

            if (!userModel) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Usuário não encontrado',
                    ),
                );
            }

            const user = this.userMapper.toDomain(userModel);
            if (user.isErr()) return R.error(user.error);

            return R.ok(user.value);
        } catch (error) {
            this.logger.error('Erro ao buscar usuário por Google ID', error);
            return R.error(
                new RepositoryException('Erro ao buscar usuário por Google ID'),
            );
        }
    }

    /**
     * Revogar session specific
     * Não usa delete direto, usa orphaned row action
     *
     * @example
     * await userRepo.revokeSession(userId, sessionId);
     */
    async revokeSession(
        userId: string,
        sessionId: string,
    ): Promise<Result<RepositoryException, UserModel>> {
        try {
            const user = await this.findByIdModel(userId);
            if (!user) {
                return R.error(new RepositoryException('User not found'));
            }

            // ✅ Remove da lista (orphanedRowAction: delete)
            user.sessions = user.sessions.filter((s) => s.id !== sessionId);

            // ✅ Salva, e a session órfã é deletada do banco
            await this.userRepository.save(user);
            return R.ok(user);
        } catch (error) {
            this.logger.error('Erro ao revogar session', error);
            return R.error(new RepositoryException('Erro ao revogar session'));
        }
    }

    /**
     * Revogar todas as sessions de um user
     */
    async revokeAllSessions(
        userId: string,
    ): Promise<Result<RepositoryException, UserModel>> {
        try {
            const user = await this.findByIdModel(userId);
            if (!user) {
                return R.error(new RepositoryException('User not found'));
            }

            // ✅ Limpa todas as sessions
            user.sessions = [];

            // ✅ Salva, todas as sessions são deletadas (orphanedRowAction)
            await this.userRepository.save(user);
            return R.ok(user);
        } catch (error) {
            this.logger.error('Erro ao revogar todas as sessions', error);
            return R.error(
                new RepositoryException('Erro ao revogar todas as sessions'),
            );
        }
    }

    // ============================================================
    // CREATE / UPDATE com Roles (UserRole)
    // ============================================================

    /**
     * Atribuir role a user (via roleIdNum)
     *
     * Encontra a role pelo id_num e cria o relacionamento
     *
     * @example
     * await userRepo.assignRole(userId, SYSTEM_ROLES.ADMIN);
     */
    async assignRole(
        userId: string,
        roleIdNum: number,
    ): Promise<UserRoleModel> {
        // ✅ Encontrar role pelo id_num
        const role = await this.roleRepository.findOne({
            where: { idNum: roleIdNum },
        });

        if (!role) {
            throw new Error(`Role com id_num ${roleIdNum} não encontrada`);
        }

        // ✅ Verificar se já existe
        const existing = await this.userRoleRepository.findOne({
            where: {
                userId,
                roleId: role.id,
            },
        });

        if (existing) {
            return existing; // Já tem essa role
        }

        // ✅ Criar novo relacionamento
        const userRole = new UserRoleModel();
        userRole.userId = userId;
        userRole.roleId = role.id;
        userRole.roleIdNum = role.idNum;
        userRole.assignedAt = new Date();

        return this.userRoleRepository.save(userRole);
    }

    /**
     * Remover role de user
     *
     * @example
     * await userRepo.removeRole(userId, SYSTEM_ROLES.ADMIN);
     */
    async removeRole(userId: string, roleIdNum: number): Promise<void> {
        // Encontrar role pelo id_num
        const role = await this.roleRepository.findOne({
            where: { idNum: roleIdNum },
        });

        if (!role) {
            throw new Error(`Role com id_num ${roleIdNum} não encontrada`);
        }

        await this.userRoleRepository.delete({
            userId,
            roleId: role.id,
        });
    }

    /**
     * Atribuir múltiplas roles de uma vez
     *
     * @example
     * await userRepo.assignRoles(userId, [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MODERATOR]);
     */
    async assignRoles(
        userId: string,
        roleIdNums: number[],
    ): Promise<UserRoleModel[]> {
        const results: UserRoleModel[] = [];

        for (const roleIdNum of roleIdNums) {
            const userRole = await this.assignRole(userId, roleIdNum);
            results.push(userRole);
        }

        return results;
    }

    /**
     * Substituir todas as roles (Revoke all + Assign new)
     *
     * @example
     * await userRepo.setRoles(userId, [SYSTEM_ROLES.MODERATOR]);
     */
    async setRoles(
        userId: string,
        roleIdNums: number[],
    ): Promise<UserRoleModel[]> {
        // ✅ Remove todas as antigas
        await this.userRoleRepository.delete({ userId });

        // ✅ Adiciona as novas
        return this.assignRoles(userId, roleIdNums);
    }

    /**
     * Obter todas as roles de um user
     */
    async getUserRoles(userId: string): Promise<UserRoleModel[]> {
        return this.userRoleRepository.find({
            where: { userId },
            relations: ['role'],
            order: { assignedAt: 'DESC' },
        });
    }

    // ============================================================
    // DELETE / CLEANUP
    // ============================================================

    /**
     * Deletar user completamente
     * Cascata no banco deleta sessions + user_roles automaticamente
     *
     * @example
     * await userRepo.deleteUser(userId);
     */
    async deleteUser(
        userId: string,
    ): Promise<Result<RepositoryException, void>> {
        try {
            const user = await this.findByIdModel(userId);
            if (!user) {
                return R.error(new RepositoryException('User not found'));
            }

            // ✅ CASCADE no banco deleta:
            // - user_roles (FK user_id)
            // - sessions (FK user_id)
            // - user
            await this.userRepository.remove(user);
            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao deletar user', error);
            return R.error(new RepositoryException('Erro ao deletar user'));
        }
    }

    // ============================================================
    // QUERIES ESPECIALIZADAS
    // ============================================================

    /**
     * Encontrar user por ID (retorna UserModel)
     * @internal Use findById para obter Result<User>
     */
    private async findByIdModel(userId: string): Promise<UserModel | null> {
        return this.userRepository.findOne({
            where: { id: userId },
        });
    }

    /**
     * Encontrar user com todas as relações carregadas explicitamente
     * Uso: quando eager: true não é suficiente
     */
    async findByIdWithRelations(userId: string): Promise<UserModel | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.sessions', 'sessions')
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('roles.role', 'role')
            .where('user.id = :id', { id: userId })
            .getOne();
    }

    /**
     * Encontrar users com roles específicas
     */
    async findByRoles(roleIdNums: number[]): Promise<UserModel[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.roles', 'roles')
            .where('roles.role_id_num IN (:...roleIdNums)', { roleIdNums })
            .distinct(true)
            .getMany();
    }

    /**
     * Encontrar users com sessions ativas (não revoked, não expiradas)
     */
    async findWithActiveSessions(): Promise<UserModel[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.sessions', 'sessions')
            .where('sessions.is_revoked = :revoked', { revoked: false })
            .andWhere('sessions.expires_at > :now', { now: new Date() })
            .distinct(true)
            .getMany();
    }
}

/**
 * ============================================================
 * PATTERNS DE USO
 * ============================================================
 *
 * 1. CRIAR USER COM SESSION INICIAL
 * ────────────────────────────────
 *   await userRepo.createWithSession(
 *     { email: 'test@example.com', provider: 'google' },
 *     { refreshToken: 'token', expiresAt: ... }
 *   );
 *
 * 2. ADICIONAR SESSION NOVA
 * ────────────────────────────
 *   await userRepo.addSession(userId, { refreshToken: 'token2', ... });
 *
 * 3. REVOGAR SESSION
 * ────────────────────────────
 *   // Opção A: Remover session específica
 *   await userRepo.revokeSession(userId, sessionId);
 *
 *   // Opção B: Remover todas
 *   await userRepo.revokeAllSessions(userId);
 *
 * 4. GERENCIAR ROLES
 * ────────────────────────────
 *   // Atribuir uma role
 *   await userRepo.assignRole(userId, SYSTEM_ROLES.ADMIN);
 *
 *   // Remover uma role
 *   await userRepo.removeRole(userId, SYSTEM_ROLES.ADMIN);
 *
 *   // Atribuir múltiplas
 *   await userRepo.assignRoles(userId, [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MODERATOR]);
 *
 *   // Substituir todas as roles
 *   await userRepo.setRoles(userId, [SYSTEM_ROLES.MODERATOR]);
 *
 *   // Obter todas as roles
 *   const roles = await userRepo.getUserRoles(userId);
 *
 * 5. DELETAR USER
 * ────────────────────────────
 *   // Deleta user + sessions + roles (CASCADE no banco)
 *   await userRepo.deleteUser(userId);
 *
 * ============================================================
 */

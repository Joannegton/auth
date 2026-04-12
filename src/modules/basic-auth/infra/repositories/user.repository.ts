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

    async findForLogin(
        email: string,
    ): ResultAsync<UserRepositoryExceptions, User> {
        try {
            const userModel = await this.userRepository
                .createQueryBuilder('user')
                .where('user.email = :email', { email })
                .leftJoinAndSelect('user.sessions', 'sessions')
                .leftJoinAndSelect('user.roles', 'roles')
                .leftJoinAndSelect('roles.role', 'role')
                .addSelect('user.password')
                .getOne();

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
            this.logger.error('Erro ao buscar usuário para login', error);
            return R.error(
                new RepositoryException('Erro ao buscar usuário para login'),
            );
        }
    }
}

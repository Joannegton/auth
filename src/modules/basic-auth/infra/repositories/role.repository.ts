import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleModel } from '../models/role.model';
import { R, Result, ResultAsync } from 'src/shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import { RoleMapper } from '../mappers/roles.mapper';
import { Role } from '../../domain/role';
import {
    RoleRepository,
    RoleRepositoryExceptions,
} from '../../domain/repositories/role.repository';

@Injectable()
export class RoleRepositoryImpl implements RoleRepository {
    private readonly logger = new Logger(RoleRepositoryImpl.name);

    constructor(
        @InjectRepository(RoleModel)
        private readonly roleRepository: Repository<RoleModel>,
        private readonly roleMapper: RoleMapper,
    ) {}

    async save(role: Role): Promise<Result<RepositoryException, void>> {
        try {
            const model = this.roleMapper.toModel(role);

            await this.roleRepository.save(model);

            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao salvar role', error);
            return R.error(new RepositoryException('Erro ao salvar role'));
        }
    }

    async find(idNum: number): ResultAsync<RoleRepositoryExceptions, Role> {
        try {
            const roleModel = await this.roleRepository.findOne({
                where: { idNum },
            });

            if (!roleModel) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Role não encontrada',
                    ),
                );
            }

            const role = this.roleMapper.toDomain(roleModel);
            if (role.isErr()) return R.error(role.error);

            return R.ok(role.value);
        } catch (error) {
            this.logger.error('Erro ao buscar role por idNum', error);
            return R.error(
                new RepositoryException('Erro ao buscar role por idNum'),
            );
        }
    }

    async findAll(): ResultAsync<RoleRepositoryExceptions, Role[]> {
        try {
            const roleModels = await this.roleRepository.find();

            if (!roleModels || roleModels.length === 0) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Nenhuma role encontrada',
                    ),
                );
            }

            const roles: Role[] = [];
            for (const model of roleModels) {
                const role = this.roleMapper.toDomain(model);
                if (role.isErr()) return R.error(role.error);
                roles.push(role.value);
            }

            return R.ok(roles);
        } catch (error) {
            this.logger.error('Erro ao buscar todas as roles', error);
            return R.error(
                new RepositoryException('Erro ao buscar todas as roles'),
            );
        }
    }
}

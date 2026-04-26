import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceModel } from '../models/service.model';
import { R, ResultAsync } from 'src/shared/domain/result';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';
import { ServiceMapper } from '../mappers/service.mapper';
import { Service } from '../../domain/service';
import {
    ServiceRepository,
    ServiceRepositoryExceptions,
} from '../../domain/repositories/service.repository';

@Injectable()
export class ServiceRepositoryImpl implements ServiceRepository {
    private readonly logger = new Logger(ServiceRepositoryImpl.name);

    constructor(
        @InjectRepository(ServiceModel)
        private readonly serviceRepository: Repository<ServiceModel>,
        private readonly serviceMapper: ServiceMapper,
    ) {}

    async save(service: Service): ResultAsync<RepositoryException, void> {
        try {
            const model = this.serviceMapper.toModel(service);
            await this.serviceRepository.save(model);
            return R.ok();
        } catch (error) {
            this.logger.error('Erro ao salvar serviço', error);
            return R.error(new RepositoryException('Erro ao salvar serviço'));
        }
    }

    async findById(
        id: string,
    ): ResultAsync<ServiceRepositoryExceptions, Service> {
        try {
            const model = await this.serviceRepository.findOne({
                where: { id },
            });

            if (!model) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Serviço não encontrado',
                    ),
                );
            }

            const service = this.serviceMapper.toDomain(model);
            if (service.isErr()) return R.error(service.error);

            return R.ok(service.value);
        } catch (error) {
            this.logger.error('Erro ao buscar serviço por ID', error);
            return R.error(
                new RepositoryException('Erro ao buscar serviço por ID'),
            );
        }
    }

    async findByName(
        name: string,
    ): ResultAsync<ServiceRepositoryExceptions, Service> {
        try {
            const model = await this.serviceRepository.findOne({
                where: { name },
            });

            if (!model) {
                return R.error(
                    new RepositoryNoDataFoundException(
                        'Serviço não encontrado',
                    ),
                );
            }

            const service = this.serviceMapper.toDomain(model);
            if (service.isErr()) return R.error(service.error);

            return R.ok(service.value);
        } catch (error) {
            this.logger.error('Erro ao buscar serviço por nome', error);
            return R.error(
                new RepositoryException('Erro ao buscar serviço por nome'),
            );
        }
    }
}

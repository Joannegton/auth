import { Inject, Injectable } from '@nestjs/common';
import {
    BusinessException,
    InvalidPropsException,
    RepositoryException,
} from 'src/shared/domain/exceptions';
import { R, ResultAsync } from 'src/shared/domain/result';
import { Service } from '../../domain/service';
import type { ServiceRepository } from '../../domain/repositories/service.repository';

export type CreateServiceUseCaseExceptions =
    | InvalidPropsException
    | BusinessException
    | RepositoryException;

export interface CreateServiceDto {
    name: string;
}

export interface CreateServiceResponse {
    id: string;
    name: string;
    apiKey: string;
    createdAt: Date;
}

@Injectable()
export class CreateServiceUseCase {
    constructor(
        @Inject('ServiceRepository')
        private readonly serviceRepository: ServiceRepository,
    ) {}

    async execute(
        props: CreateServiceDto,
    ): ResultAsync<CreateServiceUseCaseExceptions, CreateServiceResponse> {
        const serviceResult = Service.create({
            name: props.name,
        });
        if (serviceResult.isErr()) return R.error(serviceResult.error);

        const saveResult = await this.serviceRepository.save(serviceResult.value);
        if (saveResult.isErr()) return R.error(saveResult.error);

        return R.ok({
            id: serviceResult.value.id.toString(),
            name: serviceResult.value.name,
            apiKey: serviceResult.value.apiKey,
            createdAt: serviceResult.value.createdAt,
        });
    }
}

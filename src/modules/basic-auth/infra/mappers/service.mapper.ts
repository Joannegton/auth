import { Injectable } from '@nestjs/common';
import { R, Result } from 'src/shared/domain/result';
import { Service } from '../../domain/service';
import { ServiceModel } from '../models/service.model';
import { InvalidPropsException } from 'src/shared/domain/exceptions';

@Injectable()
export class ServiceMapper {
    toDomain(model: ServiceModel): Result<InvalidPropsException, Service> {
        const service = Service.build(
            {
                name: model.name,
                apiKey: model.apiKey,
                createdAt: model.createdAt,
            },
            model.id,
        );

        if (service.isErr()) return R.error(service.error);

        return R.ok(service.value);
    }

    toModel(domain: Service): ServiceModel {
        const model = ServiceModel.build({
            id: domain.id.toString(),
            name: domain.name,
            apiKey: domain.apiKey,
            createdAt: domain.createdAt,
        });
        return model;
    }
}

import { ResultAsync } from 'src/shared/domain/result';
import { Service } from '../service';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';

export type ServiceRepositoryExceptions =
    | RepositoryNoDataFoundException
    | RepositoryException;

export interface ServiceRepository {
    save(service: Service): ResultAsync<RepositoryException, void>;
    findById(id: string): ResultAsync<ServiceRepositoryExceptions, Service>;
    findByName(name: string): ResultAsync<ServiceRepositoryExceptions, Service>;
}

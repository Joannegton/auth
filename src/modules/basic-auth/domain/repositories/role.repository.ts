import { ResultAsync } from 'src/shared/domain/result';
import { Role } from '../role';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';

export type RoleRepositoryExceptions =
    | RepositoryNoDataFoundException
    | RepositoryException;

export interface RoleRepository {
    save(role: Role): ResultAsync<RoleRepositoryExceptions, void>;
    find(idNum: number): ResultAsync<RoleRepositoryExceptions, Role>;
    findAll(): ResultAsync<RoleRepositoryExceptions, Role[]>;
}

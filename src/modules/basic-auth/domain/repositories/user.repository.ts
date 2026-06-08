import { ResultAsync } from 'src/shared/domain/result';
import { User } from '../user';
import {
    RepositoryException,
    RepositoryNoDataFoundException,
} from 'src/shared/domain/exceptions';

export type UserRepositoryExceptions =
    | RepositoryNoDataFoundException
    | RepositoryException;

export interface UserRepository {
    save(user: User): ResultAsync<UserRepositoryExceptions, void>;
    findByEmail(email: string): ResultAsync<UserRepositoryExceptions, User>;
    findByEmailAndService(
        email: string,
        serviceId: string,
    ): ResultAsync<UserRepositoryExceptions, User>;
    findById(id: string): ResultAsync<UserRepositoryExceptions, User>;
    findByGoogleId(
        googleId: string,
    ): ResultAsync<UserRepositoryExceptions, User>;
    findForLogin(
        email: string,
        serviceId: string,
    ): ResultAsync<UserRepositoryExceptions, User>;
    softDeleteById(id: string): ResultAsync<RepositoryException, void>;
}

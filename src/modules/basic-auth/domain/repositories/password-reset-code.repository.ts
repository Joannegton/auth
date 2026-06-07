import { ResultAsync } from 'src/shared/domain/result';
import { RepositoryException } from 'src/shared/domain/exceptions';

export interface PasswordResetCodeData {
    id: string;
    userId: string;
    serviceId: string;
    codeHash: string;
    expiresAt: Date;
    usedAt: Date | null;
}

export interface NewPasswordResetCode {
    id: string;
    userId: string;
    serviceId: string;
    codeHash: string;
    expiresAt: Date;
}

export interface PasswordResetCodeRepository {
    save(code: NewPasswordResetCode): ResultAsync<RepositoryException, void>;
    findLatestActive(
        userId: string,
        serviceId: string,
    ): ResultAsync<RepositoryException, PasswordResetCodeData | null>;
    markUsed(id: string): ResultAsync<RepositoryException, void>;
    invalidateAllForUser(
        userId: string,
        serviceId: string,
    ): ResultAsync<RepositoryException, void>;
}

export const PASSWORD_RESET_CODE_REPOSITORY = 'PasswordResetCodeRepository';

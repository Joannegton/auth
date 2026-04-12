export interface IPasswordEncryptionService {
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_ENCRYPTION_SERVICE_TOKEN =
    'PASSWORD_ENCRYPTION_SERVICE';

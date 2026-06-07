import { ServiceException } from 'src/shared/domain/exceptions';
import { Result } from 'src/shared/domain/result';

export interface TokenPayload {
    sub: string;
    email: string;
    name?: string;
    phone?: string;
    serviceId: string;
    roles: number[];
    iat: number;
    exp: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface TokenGeneratorService {
    generateTokens(
        userId: string,
        email: string,
        serviceId: string,
        roles: number[],
        extra?: { name?: string; phone?: string },
    ): AuthTokens;
    verifyToken(token: string): Result<ServiceException, TokenPayload>;
    getPublicKey(): string;
    getRefreshTokenExpiryDays(): number;
}

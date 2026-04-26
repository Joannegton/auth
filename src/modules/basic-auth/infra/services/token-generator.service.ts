import { Inject, Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenGeneratorService } from '../../domain/services/token-generator.service';
import { ServiceException } from 'src/shared/domain/exceptions';
import { R, Result } from 'src/shared/domain/result';

export interface TokenPayload {
    sub: string;
    email: string;
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

@Injectable()
export class TokenGeneratorServiceImpl implements TokenGeneratorService {
    private readonly logger = new Logger(TokenGeneratorServiceImpl.name);
    private privateKey: string;
    private publicKey: string;

    constructor(
        @Inject('JWT_ACCESS_TOKEN_MINS_EXPIRES_IN')
        private readonly tokenExpiry: string,
        @Inject('JWT_ACCESS_TOKEN_DAYS_EXPIRES_IN')
        private readonly refreshTokenExpiry: string,
    ) {
        this.loadRsaKeys();
    }

    private loadRsaKeys(): void {
        try {
            const envPrivateKey = process.env.JWT_PRIVATE_KEY;
            const envPublicKey = process.env.JWT_PUBLIC_KEY;

            if (!envPrivateKey || !envPublicKey) {
                throw new Error(
                    'JWT_PRIVATE_KEY e JWT_PUBLIC_KEY são obrigatórios',
                );
            }

            this.privateKey = envPrivateKey.replace(/\\n/g, '\n');
            this.publicKey = envPublicKey.replace(/\\n/g, '\n');
            this.logger.log('Chaves JWT carregadas com sucesso do environment');
        } catch (error) {
            this.logger.error(
                'Falha ao carregar chaves JWT',
                error instanceof Error ? error.message : String(error),
            );
            throw new Error(
                'Falha ao carregar chaves JWT - defina JWT_PRIVATE_KEY e JWT_PUBLIC_KEY no .env',
            );
        }
    }

    generateTokens(
        userId: string,
        email: string,
        serviceId: string,
        idNumRoles: number[], // mudar para ids string, verificar
    ): AuthTokens {
        const payload = {
            sub: userId,
            email,
            serviceId,
            roles: idNumRoles,
        };

        const accessToken = jwt.sign(payload, this.privateKey, {
            algorithm: 'RS256',
            expiresIn: this.tokenExpiry,
        } as jwt.SignOptions);

        const refreshToken = jwt.sign(payload, this.privateKey, {
            algorithm: 'RS256',
            expiresIn: this.refreshTokenExpiry,
        } as jwt.SignOptions);

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutos
        };
    }

    verifyToken(token: string): Result<ServiceException, TokenPayload> {
        try {
            const decoded = jwt.verify(token, this.publicKey, {
                algorithms: ['RS256'],
            } as jwt.VerifyOptions) as TokenPayload;

            return R.ok(decoded);
        } catch (error) {
            this.logger.debug('Token verification failed', error);
            return R.error(
                new ServiceException('Erro na verificação de token'),
            );
        }
    }

    getPublicKey(): string {
        return this.publicKey;
    }

    getRefreshTokenExpiryDays(): number {
        const expiresIn = this.refreshTokenExpiry;
        const days = Number.parseInt(expiresIn.replaceAll(/\D/g, ''), 10);
        return Number.isNaN(days) ? 7 : days;
    }
}

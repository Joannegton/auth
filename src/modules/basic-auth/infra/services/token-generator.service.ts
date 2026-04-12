import { Inject, Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TokenGeneratorService } from '../../domain/services/token-generator.service';
import { ServiceException } from 'src/shared/domain/exceptions';
import { R, Result } from 'src/shared/domain/result';

export interface TokenPayload {
    sub: string;
    email: string;
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
            const keysDir = process.env.KEYS_DIR || '.secrets';
            this.privateKey = fs.readFileSync(
                path.join(keysDir, 'private.pem'),
                'utf-8',
            );
            this.publicKey = fs.readFileSync(
                path.join(keysDir, 'public.pem'),
                'utf-8',
            );
            this.logger.log('chaves de tokens carregado com sucesso');
        } catch (error) {
            this.logger.error(
                'Falha ao carregar chaves de tokens',
                error instanceof Error ? error.message : String(error),
            );
            throw new Error('Falha ao carregar chaves de tokens');
        }
    }

    generateTokens(userId: string, email: string): AuthTokens {
        const payload = {
            sub: userId,
            email,
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

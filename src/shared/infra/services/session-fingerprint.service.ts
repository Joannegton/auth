import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request } from 'express';

export interface SessionFingerprint {
    userAgent: string;
    ipAddress: string;
    fingerprint: string;
}

/**
 * Serviço de Fingerprinting de Sessão
 *
 * Gera um hash baseado em:
 * - User-Agent (dispositivo/browser)
 * - IP Address (rede)
 *
 * Uso: Validar que o mesmo dispositivo está usando o token
 * Se detectar diferença, é possível token hijacking
 *
 * Limitações:
 * - User-Agent pode ser falsificado
 * - IP pode mudar (mobile network switching)
 * - Requer implementação mais robusta para produção (GPS, deviceId, etc)
 */
@Injectable()
export class SessionFingerprintService {
    private readonly logger = new Logger(SessionFingerprintService.name);

    /**
     * Gera fingerprint baseado em User-Agent + IP
     */
    generateFingerprint(req: Request): SessionFingerprint {
        const userAgent = req.get('user-agent') || 'unknown';
        const ipAddress = this.extractIpAddress(req);

        const combo = `${userAgent}:${ipAddress}`;
        const fingerprint = crypto
            .createHash('sha256')
            .update(combo)
            .digest('hex');

        return {
            userAgent,
            ipAddress,
            fingerprint,
        };
    }

    /**
     * Valida se fingerprint atual corresponde ao armazenado
     *
     * Retorna true se for igual (mesmo device)
     * Retorna false se for diferente (possível hijacking)
     */
    validateFingerprint(req: Request, storedFingerprint: string): boolean {
        const currentFingerprint = this.generateFingerprint(req);
        const isValid = currentFingerprint.fingerprint === storedFingerprint;

        if (!isValid) {
            this.logger.warn('⚠️ Fingerprint mismatch detected', {
                stored: storedFingerprint,
                current: currentFingerprint.fingerprint,
                userAgent: currentFingerprint.userAgent,
                ipAddress: currentFingerprint.ipAddress,
            });
        }

        return isValid;
    }

    /**
     * Extrai IP real da requisição
     * Lida com proxies, load balancers, etc
     */
    private extractIpAddress(req: Request): string {
        // Tenta extrair de headers de proxy
        const forwardedFor = req.get('x-forwarded-for');
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }

        // Tenta header de proxy real
        const realIp = req.get('x-real-ip');
        if (realIp) {
            return realIp;
        }

        // Fallback para IP da conexão
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }

    /**
     * Detecta mudança de localização geográfica (opcional)
     *
     * TODO: Implementar com IP geolocation API
     * - MaxMind GeoIP2
     * - IP2Location
     * - Alertar se mudar de país em tempo curto
     */
    async detectGeolocationChange(
        ipAddress: string,
        previousIpAddress?: string,
    ): Promise<{ changed: boolean; alert: boolean }> {
        // Implementação futura
        return { changed: false, alert: false };
    }
}

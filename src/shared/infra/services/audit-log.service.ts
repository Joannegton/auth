import { Injectable, Logger } from '@nestjs/common';

export interface AuditEvent {
    userId?: string;
    action: string;  // LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_CHANGE, etc
    status: 'SUCCESS' | 'FAILURE';
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    timestamp?: Date;
}

/**
 * Serviço de Auditoria
 *
 * Log de eventos críticos para:
 * - Rastrear atividades suspeitas
 * - Investigar incidentes de segurança
 * - Conformidade e compliance
 *
 * Implementação atual: Console (development)
 * Produção: Integrar com DataDog, CloudWatch, ELK Stack, etc
 */
@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    async log(event: AuditEvent): Promise<void> {
        const logEntry = {
            timestamp: event.timestamp || new Date().toISOString(),
            userId: event.userId,
            action: event.action,
            status: event.status,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            details: event.details,
        };

        // Development: Console log
        if (process.env.NODE_ENV === 'development') {
            const logLevel = event.status === 'SUCCESS' ? 'log' : 'warn';
            this.logger[logLevel](JSON.stringify(logEntry, null, 2));
        }

        // Production: Send to external service
        if (process.env.NODE_ENV === 'production') {
            await this.sendToExternalService(logEntry);
        }
    }

    private async sendToExternalService(logEntry: any): Promise<void> {
        // TODO: Implementar integração com:
        // - DataDog
        // - CloudWatch
        // - ELK Stack
        // - Supabase (logs table)
        // - Custom HTTP endpoint

        // Por agora, apenas log no console
        console.log('[AUDIT]', logEntry);
    }

    // Métodos helper para casos de uso comuns
    async logLoginSuccess(userId: string, ipAddress: string, userAgent: string): Promise<void> {
        await this.log({
            userId,
            action: 'LOGIN_SUCCESS',
            status: 'SUCCESS',
            ipAddress,
            userAgent,
        });
    }

    async logLoginFailure(email: string, ipAddress: string, userAgent: string, reason: string): Promise<void> {
        await this.log({
            action: 'LOGIN_FAILURE',
            status: 'FAILURE',
            ipAddress,
            userAgent,
            details: { email, reason },
        });
    }

    async logLogout(userId: string, ipAddress: string, userAgent: string): Promise<void> {
        await this.log({
            userId,
            action: 'LOGOUT',
            status: 'SUCCESS',
            ipAddress,
            userAgent,
        });
    }

    async logPasswordChange(userId: string, ipAddress: string, userAgent: string): Promise<void> {
        await this.log({
            userId,
            action: 'PASSWORD_CHANGED',
            status: 'SUCCESS',
            ipAddress,
            userAgent,
        });
    }

    async logTokenRefresh(userId: string, ipAddress: string, userAgent: string): Promise<void> {
        await this.log({
            userId,
            action: 'TOKEN_REFRESHED',
            status: 'SUCCESS',
            ipAddress,
            userAgent,
        });
    }

    async logSecurityEvent(userId: string, action: string, details: any): Promise<void> {
        await this.log({
            userId,
            action,
            status: 'FAILURE',
            details,
        });
    }
}

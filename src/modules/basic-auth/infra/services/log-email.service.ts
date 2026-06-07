import { Injectable, Logger } from '@nestjs/common';
import { IEmailService } from '../../domain/services/email.service';

/**
 * Adaptador de e-mail para desenvolvimento: apenas registra o conteúdo no log,
 * permitindo testar o fluxo de reset de senha ponta a ponta sem um provedor.
 * Em produção, trocar por um adaptador SMTP/SendGrid/SES configurado por env.
 */
@Injectable()
export class LogEmailService implements IEmailService {
    private readonly logger = new Logger('EmailService');

    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        this.logger.warn(
            `[DEV] Código de redefinição de senha para ${email}: ${code} ` +
                `(configure um provedor de e-mail real em produção)`,
        );
        return Promise.resolve();
    }
}

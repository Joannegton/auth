import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailService } from '../../domain/services/email.service';

const CODE_TTL_MINUTES = 15;

/**
 * Adaptador de e-mail real via Gmail (nodemailer). Usa `EMAIL_USER` e
 * `EMAIL_PASS` — no Gmail o `EMAIL_PASS` precisa ser uma **App Password**
 * (conta com 2FA), não a senha normal. O nome do remetente vem de
 * `EMAIL_FROM_NAME` (padrão "Suporte"). Falhas de envio são logadas e não
 * propagam (mantém o contrato best-effort do fluxo de reset).
 */
@Injectable()
export class NodemailerEmailService implements IEmailService {
    private readonly logger = new Logger('EmailService');
    private readonly transporter: nodemailer.Transporter;
    private readonly fromName: string;

    constructor() {
        this.fromName = process.env.EMAIL_FROM_NAME || 'Suporte';
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        try {
            const result = await this.transporter.sendMail({
                from: `"${this.fromName}" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Código de redefinição de senha',
                text:
                    `Seu código de redefinição de senha é ${code}. ` +
                    `Ele expira em ${CODE_TTL_MINUTES} minutos. ` +
                    `Se você não solicitou, ignore este e-mail.`,
                html: this.buildHtml(code),
            });
            this.logger.log(
                `Código de redefinição enviado para ${email}. Message ID: ${result.messageId}`,
            );
        } catch (error) {
            this.logger.error(
                `Falha ao enviar código de redefinição para ${email}: ${(error as Error).message}`,
            );
        }
    }

    private buildHtml(code: string): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
                <h2 style="margin: 0 0 12px;">Redefinição de senha</h2>
                <p style="margin: 0 0 16px; color: #444;">
                    Use o código abaixo para redefinir sua senha. Ele expira em
                    ${CODE_TTL_MINUTES} minutos.
                </p>
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px;
                            background: #f4f4f5; border-radius: 10px; padding: 16px;
                            text-align: center; margin: 0 0 16px;">
                    ${code}
                </div>
                <p style="margin: 0; color: #888; font-size: 13px;">
                    Se você não solicitou esta redefinição, ignore este e-mail.
                </p>
            </div>
        `;
    }
}

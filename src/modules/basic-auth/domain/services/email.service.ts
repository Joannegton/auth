export interface IEmailService {
    sendPasswordResetCode(email: string, code: string): Promise<void>;
}

export const EMAIL_SERVICE_TOKEN = 'EMAIL_SERVICE';

import { Result, R } from 'src/shared/domain/result';
import { InvalidPasswordException } from '../exceptions/invalidPassword.exception';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordValidatorPolicy {
    execute(password?: string): Result<InvalidPasswordException, void> {
        if (!password) {
            return R.ok();
        }

        // Validações de força de senha
        const hasMinLength = password.length >= 8;
        const hasMaxLength = password.length <= 128;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
            password,
        );
        const noSpaces = !/\s/.test(password);

        if (
            !hasMinLength ||
            !hasMaxLength ||
            !hasUpperCase ||
            !hasLowerCase ||
            !hasDigit ||
            !hasSpecialChar ||
            !noSpaces
        ) {
            const errors: string[] = [];

            if (!hasMinLength) errors.push('mínimo 8 caracteres');
            if (!hasMaxLength) errors.push('máximo 128 caracteres');
            if (!hasUpperCase) errors.push('pelo menos uma letra maiúscula');
            if (!hasLowerCase) errors.push('pelo menos uma letra minúscula');
            if (!hasDigit) errors.push('pelo menos um número');
            if (!hasSpecialChar)
                errors.push('pelo menos um caractere especial');
            if (!noSpaces) errors.push('sem espaços em branco');

            return R.error(
                new InvalidPasswordException(
                    `Senha inválida: ${errors.join(', ')}`,
                ),
            );
        }

        return R.ok();
    }
}

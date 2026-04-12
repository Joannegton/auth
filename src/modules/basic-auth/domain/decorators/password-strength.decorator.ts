import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint
    implements ValidatorConstraintInterface {
    validate(password: any, args: ValidationArguments) {
        if (!password || typeof password !== 'string') {
            return false;
        }

        // Validações de força de senha
        const hasMinLength = password.length >= 8;
        const hasMaxLength = password.length <= 128;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        const noSpaces = !/\s/.test(password);

        return (
            hasMinLength &&
            hasMaxLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasDigit &&
            hasSpecialChar &&
            noSpaces
        );
    }

    defaultMessage(args: ValidationArguments) {
        const password = args.value;
        const errors: string[] = [];

        if (!password || password.length < 8) {
            errors.push('mínimo 8 caracteres');
        }
        if (password?.length > 128) {
            errors.push('máximo 128 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('pelo menos uma letra maiúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('pelo menos uma letra minúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('pelo menos um número');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('pelo menos um caractere especial');
        }
        if (/\s/.test(password)) {
            errors.push('sem espaços em branco');
        }

        return `Senha inválida: ${errors.join(', ')}`;
    }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsStrongPasswordConstraint,
        });
    };
}

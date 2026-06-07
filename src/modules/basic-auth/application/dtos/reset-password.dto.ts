import { IsEmail, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsUUID()
    serviceId: string;

    @IsString()
    @Length(6, 6, { message: 'Código deve ter 6 dígitos' })
    code: string;

    @IsString()
    @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres' })
    newPassword: string;
}

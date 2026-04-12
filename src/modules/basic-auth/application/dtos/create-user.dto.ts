import { IsEmail, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPassword } from '../../domain/decorators/password-strength.decorator';

export class CreateUserDto {
    @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
    @Transform(({ value }) => value?.trim().toLowerCase())
    email: string;

    @IsStrongPassword({
        message:
            'Password deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos',
    })
    password: string;

    @IsOptional()
    @IsNumber({}, { message: 'Role ID deve ser um número' })
    @IsPositive({ message: 'Role ID deve ser um número positivo' })
    roleIdNum?: number;

    @IsOptional()
    creatorUserId?: string;
}

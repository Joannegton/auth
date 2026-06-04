import {
    IsEmail,
    IsNumber,
    IsPositive,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../domain/decorators/password-strength.decorator';

export class CreateUserDto {
    @ApiProperty({ example: 'usuario@exemplo.com', description: 'Email do usuário' })
    @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
    @Transform(({ value }) => value?.trim().toLowerCase())
    email: string;

    @ApiPropertyOptional({ example: 'Maria Silva', description: 'Nome do usuário' })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Nome muito curto' })
    @MaxLength(120)
    name?: string;

    @ApiPropertyOptional({ example: '(11) 98888-7777', description: 'Telefone do usuário' })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[0-9\s().-]{10,20}$/, { message: 'Telefone inválido' })
    @MaxLength(20)
    phone?: string;

    @ApiProperty({ example: 'Senha@123!', description: 'Senha forte (mín. 8 chars, maiúscula, minúscula, número e símbolo)' })
    @IsStrongPassword({
        message:
            'Password deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos',
    })
    password: string;

    @ApiPropertyOptional({ example: 2, description: 'ID numérico do papel (role). Omita para usar o padrão.' })
    @IsOptional()
    @IsNumber({}, { message: 'Role ID deve ser um número' })
    @IsPositive({ message: 'Role ID deve ser um número positivo' })
    roleIdNum?: number;

    @ApiPropertyOptional({ description: 'ID do usuário criador (preenchido automaticamente quando autenticado)' })
    @IsOptional()
    creatorUserId?: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID do serviço ao qual o usuário pertence' })
    @IsUUID()
    serviceId: string;
}

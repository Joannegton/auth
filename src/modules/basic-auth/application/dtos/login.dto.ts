import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'demo@joannegton.com', description: 'Email do usuário' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Demo@12345!', description: 'Senha do usuário' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID do serviço' })
    @IsUUID()
    serviceId: string;
}

export class RefreshTokenDto {
    @ApiProperty({ description: 'Refresh token retornado no login' })
    @IsString()
    refreshToken: string;
}

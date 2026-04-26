import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsUUID()
    serviceId: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

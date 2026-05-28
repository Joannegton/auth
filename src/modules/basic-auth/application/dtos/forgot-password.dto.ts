import { IsEmail, IsUUID } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail()
    email: string;

    @IsUUID()
    serviceId: string;
}

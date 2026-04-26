import {
    IsEmail,
    IsString,
    MinLength,
    IsUUID,
    IsOptional,
    IsNumber,
    Min,
    Max,
} from 'class-validator';

export class CreateWorkerDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsUUID()
    serviceId: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(6)
    roleIdNum?: number;

    @IsUUID()
    creatorUserId: string;
}

import {
    Controller as NestController,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { CreateServiceUseCase } from '../usecases/create-service.usecase';
import { CreateWorkerUseCase } from '../usecases/create-worker.usecase';
import { Controller } from 'src/shared/infra/http/controller';
import { JwtAuthGuard } from 'src/shared/infra/guards/jwt-auth.guard';
import { RoleGuard, RequireRoles } from 'src/shared/infra/guards/role.guard';
import { ExtractUserId } from '../../domain/decorators/extract-user-id.decorator';
import { ROLES } from '../../domain/constants/roles.constants';

export interface CreateServiceDto {
    name: string;
}

export interface CreateWorkerDto {
    email: string;
    password: string;
    roleIdNum?: number;
    serviceId: string;
}

@NestController('services')
export class ServicesController extends Controller {
    constructor(
        private readonly createServiceUseCase: CreateServiceUseCase,
        private readonly createWorkerUseCase: CreateWorkerUseCase,
    ) {
        super();
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @RequireRoles(ROLES.ADMIN)
    async createService(@Body() createServiceDto: CreateServiceDto) {
        const result = await this.createServiceUseCase.execute({
            name: createServiceDto.name,
        });

        return this.buildResponse(result);
    }

    @Post('users')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @RequireRoles(ROLES.OWNER, ROLES.ADMIN)
    async createWorker(
        @Body() createWorkerDto: CreateWorkerDto,
        @ExtractUserId() creatorUserId: string,
    ) {
        const result = await this.createWorkerUseCase.execute({
            email: createWorkerDto.email,
            password: createWorkerDto.password,
            roleIdNum: createWorkerDto.roleIdNum || ROLES.WORKER,
            serviceId: createWorkerDto.serviceId,
            creatorUserId: creatorUserId,
        });

        return this.buildResponse(result);
    }
}

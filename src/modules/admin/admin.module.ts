import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from '../basic-auth/infra/models/user.model';
import { SessionModel } from '../basic-auth/infra/models/session.model';
import { RoleModel } from '../basic-auth/infra/models/role.model';
import { ServiceModel } from '../basic-auth/infra/models/service.model';
import { UserRoleModel } from '../basic-auth/infra/models/user-roles.model';
import { AdminQueryService } from './infra/admin-query.service';
import { AdminController } from './application/controllers/admin.controller';
import { TokenGeneratorServiceImpl } from '../basic-auth/infra/services/token-generator.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserModel,
            SessionModel,
            RoleModel,
            ServiceModel,
            UserRoleModel,
        ]),
    ],
    controllers: [AdminController],
    providers: [
        AdminQueryService,
        TokenGeneratorServiceImpl,
        {
            provide: 'JWT_ACCESS_TOKEN_MINS_EXPIRES_IN',
            useValue: process.env.JWT_ACCESS_TOKEN_MINS_EXPIRES_IN || '15m',
        },
        {
            provide: 'JWT_ACCESS_TOKEN_DAYS_EXPIRES_IN',
            useValue: process.env.JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN || '7d',
        },
    ],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SharedModule } from '../../shared/shared.module';
import { CriarUsuarioUseCase } from './application/usecases/criar-usuario.usecase';
import { LoginUseCase } from './application/usecases/login.usecase';
import { RefreshTokenUseCase } from './application/usecases/refresh-token.usecase';
import { LogoutUseCase } from './application/usecases/logout.usecase';
import { GoogleLoginUseCase } from './application/usecases/google-login.usecase';
import { UserModel } from './infra/models/user.model';
import { SessionModel } from './infra/models/session.model';
import { UserRoleModel } from './infra/models/user-roles.model';
import { RoleModel } from './infra/models/role.model';
import { AuthController } from './application/controllers/auth.controller';
import { GoogleAuthController } from './application/controllers/google-auth.controller';
import { Policies } from './domain/policies';
import { Repositories } from './infra/repositories';
import { Mappers } from './infra/mappers';
import { TokenGeneratorServiceImpl } from './infra/services/token-generator.service';
import { BcryptPasswordEncryptionService } from './infra/services/password-encryption.service';
import { PASSWORD_ENCRYPTION_SERVICE_TOKEN } from './domain/services/password-encryption.service';
import { GoogleStrategy } from './infra/strategies/google.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserModel,
            SessionModel,
            UserRoleModel,
            RoleModel,
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        SharedModule,
    ],
    controllers: [AuthController, GoogleAuthController],
    providers: [
        CriarUsuarioUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        GoogleLoginUseCase,
        TokenGeneratorServiceImpl,
        {
            provide: 'TokenGenerator',
            useClass: TokenGeneratorServiceImpl,
        },
        BcryptPasswordEncryptionService,
        {
            provide: PASSWORD_ENCRYPTION_SERVICE_TOKEN,
            useClass: BcryptPasswordEncryptionService,
        },
        {
            provide: 'JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN',
            useValue: process.env.JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN || '7d',
        },
        {
            provide: 'JWT_ACCESS_TOKEN_MINS_EXPIRES_IN',
            useValue: process.env.JWT_ACCESS_TOKEN_MINS_EXPIRES_IN || '15m',
        },
        {
            provide: 'JWT_ACCESS_TOKEN_DAYS_EXPIRES_IN',
            useValue: process.env.JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN || '7d',
        },
        GoogleStrategy,
        ...Policies,
        ...Repositories,
        ...Mappers,
    ],
    exports: [
        'UserRepository',
        'RoleRepository',
        TokenGeneratorServiceImpl,
    ],
})
export class BasicAuthModule {}

import {
    Controller as NestController,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CriarUsuarioUseCase } from '../../application/usecases/criar-usuario.usecase';
import { LoginUseCase } from '../../application/usecases/login.usecase';
import { RefreshTokenUseCase } from '../../application/usecases/refresh-token.usecase';
import { LogoutUseCase } from '../../application/usecases/logout.usecase';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginDto, RefreshTokenDto } from '../dtos/login.dto';
import { ExtractUserId } from '../../domain/decorators/extract-user-id.decorator';
import {
    ExtractRequestInfo,
    type RequestInfo,
} from '../../domain/decorators/extract-request-info.decorator';
import { Controller } from 'src/shared/infra/http/controller';
import { TokenGeneratorServiceImpl } from '../../infra/services/token-generator.service';
import { JwtAuthGuard } from 'src/shared/infra/guards/jwt-auth.guard';

@NestController('auth')
export class AuthController extends Controller {
    constructor(
        private readonly criarUsuarioUseCase: CriarUsuarioUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly tokenGenerator: TokenGeneratorServiceImpl,
    ) {
        super();
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(ThrottlerGuard)
    async register(
        @Body() createUserDto: CreateUserDto,
        @ExtractUserId() creatorUserId?: string,
    ) {
        const result = await this.criarUsuarioUseCase.execute({
            email: createUserDto.email,
            password: createUserDto.password,
            roleIdNum: createUserDto.roleIdNum,
            creatorUserId: creatorUserId,
        });

        return this.buildResponse(result);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(ThrottlerGuard)
    async login(
        @Body() loginDto: LoginDto,
        @ExtractRequestInfo() requestInfo: RequestInfo,
    ) {
        const result = await this.loginUseCase.execute(
            {
                email: loginDto.email,
                password: loginDto.password,
            },
            requestInfo,
        );

        return this.buildResponse(result);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        const result = await this.refreshTokenUseCase.execute({
            refreshToken: refreshTokenDto.refreshToken,
        });

        return this.buildResponse(result);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(
        @ExtractUserId() userId: string,
        @ExtractRequestInfo() requestInfo: RequestInfo,
    ) {
        const result = await this.logoutUseCase.execute(userId, requestInfo);

        return this.buildResponse(result);
    }

    @Get('public-key')
    @HttpCode(HttpStatus.OK)
    getPublicKey() {
        const publicKey = this.tokenGenerator.getPublicKey();
        return this.ok({ publicKey });
    }
}

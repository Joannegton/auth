import {
    Controller as NestController,
    Post,
    Get,
    Delete,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OptionalJwtAuthGuard } from 'src/shared/infra/guards/optional-jwt-auth.guard';
import { CreateUserUseCase } from '../usecases/create-user.usecase';
import { LoginUseCase } from '../../application/usecases/login.usecase';
import { RefreshTokenUseCase } from '../../application/usecases/refresh-token.usecase';
import { LogoutUseCase } from '../../application/usecases/logout.usecase';
import { CreateWorkerUseCase } from '../usecases/create-worker.usecase';
import { DeleteAccountUseCase } from '../usecases/delete-account.usecase';
import { ForgotPasswordUseCase } from '../usecases/forgot-password.usecase';
import { ResetPasswordUseCase } from '../usecases/reset-password.usecase';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginDto, RefreshTokenDto } from '../dtos/login.dto';
import { CreateWorkerDto } from '../dtos/create-worker.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ExtractUserId } from '../../domain/decorators/extract-user-id.decorator';
import {
    ExtractRequestInfo,
    type RequestInfo,
} from '../../domain/decorators/extract-request-info.decorator';
import { Controller } from 'src/shared/infra/http/controller';
import { TokenGeneratorServiceImpl } from '../../infra/services/token-generator.service';
import { JwtAuthGuard } from 'src/shared/infra/guards/jwt-auth.guard';

@ApiTags('Auth')
@NestController('auth')
export class AuthController extends Controller {
    constructor(
        private readonly criarUsuarioUseCase: CreateUserUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly createWorkerUseCase: CreateWorkerUseCase,
        private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly tokenGenerator: TokenGeneratorServiceImpl,
        private readonly deleteAccountUseCase: DeleteAccountUseCase,
    ) {
        super();
    }

    @ApiOperation({ summary: 'Registrar usuário', description: 'Cria um novo usuário no serviço especificado.' })
    @ApiResponse({ status: 200, description: 'Usuário criado com sucesso' })
    @Post('register')
    @HttpCode(HttpStatus.OK)
    @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
    async register(
        @Body() createUserDto: CreateUserDto,
        @ExtractUserId() creatorUserId?: string,
    ) {
        const result = await this.criarUsuarioUseCase.execute({
            email: createUserDto.email,
            name: createUserDto.name,
            phone: createUserDto.phone,
            password: createUserDto.password,
            roleIdNum: createUserDto.roleIdNum,
            creatorUserId: creatorUserId,
            serviceId: createUserDto.serviceId,
        });

        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Login', description: 'Autentica com email + senha e retorna access + refresh tokens.' })
    @ApiResponse({ status: 200, description: 'Login bem-sucedido — retorna accessToken e refreshToken' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
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
                serviceId: loginDto.serviceId,
            },
            requestInfo,
        );

        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Refresh token', description: 'Gera novos access + refresh tokens a partir de um refresh token válido.' })
    @ApiResponse({ status: 200, description: 'Tokens renovados' })
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        const result = await this.refreshTokenUseCase.execute({
            refreshToken: refreshTokenDto.refreshToken,
        });

        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Logout', description: 'Invalida o refresh token do usuário autenticado.' })
    @ApiBearerAuth()
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

    @Post('workers')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    async createWorker(
        @Body() createWorkerDto: CreateWorkerDto,
        @ExtractUserId() userId: string,
    ) {
        const result = await this.createWorkerUseCase.execute({
            email: createWorkerDto.email,
            password: createWorkerDto.password,
            roleIdNum: createWorkerDto.roleIdNum,
            serviceId: createWorkerDto.serviceId,
            creatorUserId: userId,
        });

        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Esqueci a senha', description: 'Gera um código de redefinição e o envia por e-mail (não revela se o e-mail existe).' })
    @ApiResponse({ status: 200, description: 'Solicitação recebida' })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(ThrottlerGuard)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        const result = await this.forgotPasswordUseCase.execute(
            dto.email,
            dto.serviceId,
        );
        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Redefinir senha', description: 'Redefine a senha usando o código recebido por e-mail.' })
    @ApiResponse({ status: 200, description: 'Senha redefinida' })
    @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(ThrottlerGuard)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        const result = await this.resetPasswordUseCase.execute(
            dto.email,
            dto.serviceId,
            dto.code,
            dto.newPassword,
        );
        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Excluir conta', description: 'Soft-deleta o usuário autenticado. Chamado internamente pelo beleze_server após validação de elegibilidade.' })
    @ApiBearerAuth()
    @Delete('account')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@ExtractUserId() userId: string) {
        const result = await this.deleteAccountUseCase.execute(userId);
        return this.buildResponse(result);
    }

    @ApiOperation({ summary: 'Public key RS256', description: 'Retorna a chave pública RSA usada para verificar JWTs emitidos por este serviço.' })
    @ApiResponse({ status: 200, description: 'PEM da chave pública' })
    @Get('public-key')
    @HttpCode(HttpStatus.OK)
    getPublicKey() {
        const publicKey = this.tokenGenerator.getPublicKey();
        return this.ok({ publicKey });
    }
}

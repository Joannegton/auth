import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { TokenGeneratorServiceImpl } from 'src/modules/basic-auth/infra/services/token-generator.service';

/**
 * Guard para validar JWT access tokens
 * Extrai o token do header Authorization e valida usando a chave pública
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private tokenGenerator: TokenGeneratorServiceImpl) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedException(
                'Invalid authorization header format',
            );
        }

        const payloadResult = this.tokenGenerator.verifyToken(token);
        if (payloadResult.isErr()) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        request.user = payloadResult.value;

        return true;
    }
}

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
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

        const payload = this.tokenGenerator.verifyToken(token);
        if (!payload) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        // Attach user to request for downstream handlers
        request.user = payload;

        return true;
    }
}

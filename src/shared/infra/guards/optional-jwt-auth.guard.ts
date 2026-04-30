import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenGeneratorServiceImpl } from 'src/modules/basic-auth/infra/services/token-generator.service';

/**
 * Guard para validar JWT access tokens de forma opcional
 * Se houver token válido, valida e popula request.user
 * Se não houver token ou for inválido, deixa continuar sem erro
 *
 * Ideal para endpoints que permitem acesso público MAS também
 * aceitam autenticação (ex: /auth/register)
 *
 * @example
 * @UseGuards(OptionalJwtAuthGuard)
 * @Post('register')
 * register(@ExtractUserId() userId?: string) {
 *   // userId será preenchido se houver JWT válido
 *   // userId será undefined se não houver JWT
 * }
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(OptionalJwtAuthGuard.name);

    constructor(private tokenGenerator: TokenGeneratorServiceImpl) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // Se não houver header, deixa continuar sem token
        if (!authHeader) {
            return true;
        }

        const [scheme, token] = authHeader.split(' ');

        // Se o formato não for Bearer ou não houver token, deixa continuar
        if (scheme !== 'Bearer' || !token) {
            return true;
        }

        // Decodifica sem validar para checar se está expirado
        let decoded: any;
        try {
            decoded = jwt.decode(token, { complete: true });
        } catch {
            throw new UnauthorizedException('Token inválido');
        }

        if (!decoded) {
            throw new UnauthorizedException('Token inválido');
        }

        // Verifica expiração manualmente
        const now = Math.floor(Date.now() / 1000);
        if (decoded.payload.exp && decoded.payload.exp < now) {
            throw new UnauthorizedException('Token expirado. Faça login novamente');
        }

        // Valida o token com a chave pública
        const payloadResult = this.tokenGenerator.verifyToken(token);

        if (payloadResult.isErr()) {
            throw new UnauthorizedException('Token inválido ou assinatura incorreta');
        }

        // Se conseguir validar, popula request.user
        request.user = payloadResult.value;
        return true;
    }
}

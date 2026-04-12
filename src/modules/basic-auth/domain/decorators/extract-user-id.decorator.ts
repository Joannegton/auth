import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator que extrai o User ID do JWT (Authorization header)
 * Se o usuário está autenticado, injeta o ID automaticamente
 * Se não está autenticado, retorna undefined
 *
 * @example
 * register(@ExtractUserId() userId?: string) {
 *   // userId será preenchido automaticamente se tiver JWT válido
 * }
 */
export const ExtractUserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        // Tenta extrair de diferentes lugares onde o JWT pode estar
        // 1. req.user.id (passado pelo middleware/guard de autenticação)
        if (request.user?.id) {
            return request.user.id;
        }

        // 2. req.user.sub (padrão do JWT/OIDC)
        if (request.user?.sub) {
            return request.user.sub;
        }

        // Se não encontrar, retorna undefined
        return undefined;
    },
);

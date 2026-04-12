import { AppResponse, HttpResponse } from './app-response';

/**
 * Classe base para todos os controllers
 * Fornece métodos para respostas padronizadas
 */
export abstract class Controller {
    /**
     * Retorna uma resposta de sucesso
     */
    protected ok<T>(data: T): HttpResponse<T> {
        return AppResponse.ok(data);
    }

    /**
     * Retorna uma resposta de erro genérico
     */
    protected error(
        message: string,
        statusCode: number = 500,
        code?: string,
    ): HttpResponse {
        return AppResponse.error(message, statusCode, code);
    }

    /**
     * Retorna uma resposta de erro com validação (400)
     */
    protected badRequest(message: string, code?: string): HttpResponse {
        return AppResponse.badRequest(message, code);
    }

    /**
     * Retorna uma resposta de erro não autorizado (401)
     */
    protected unauthorized(
        message: string = 'Unauthorized',
        code?: string,
    ): HttpResponse {
        return AppResponse.unauthorized(message, code);
    }

    /**
     * Retorna uma resposta de erro proibido (403)
     */
    protected forbidden(
        message: string = 'Forbidden',
        code?: string,
    ): HttpResponse {
        return AppResponse.forbidden(message, code);
    }

    /**
     * Retorna uma resposta de erro não encontrado (404)
     */
    protected notFound(
        message: string = 'Not found',
        code?: string,
    ): HttpResponse {
        return AppResponse.notFound(message, code);
    }

    /**
     * Retorna uma resposta de erro conflito (409)
     */
    protected conflict(message: string, code?: string): HttpResponse {
        return AppResponse.conflict(message, code);
    }

    /**
     * Retorna uma resposta de erro interno do servidor (500)
     */
    protected internalServerError(
        message: string = 'Internal server error',
        code?: string,
    ): HttpResponse {
        return AppResponse.internalServerError(message, code);
    }

    /**
     * Converte um Result<E, T> para HttpResponse automaticamente
     * Útil para usar cases que retornam Result
     */
    protected buildResponse<
        E extends { message: string; statusCode?: number; code?: string },
        T,
    >(result: {
        isErr(): boolean;
        isOk(): boolean;
        error?: E;
        value?: T;
    }): HttpResponse {
        if (result.isErr() && result.error) {
            const err = result.error;
            return this.error(err.message, err.statusCode || 400, err.code);
        }

        if (result.isOk() && result.value !== undefined) {
            return this.ok(result.value);
        }

        return this.ok(null);
    }
}

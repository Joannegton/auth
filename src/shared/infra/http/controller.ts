import { AppResponse, HttpResponse } from './app-response';
import { HttpException } from '@nestjs/common';

/**
 * Classe base para todos os controllers
 * Fornece métodos para respostas padronizadas
 */
export abstract class Controller {
    protected ok<T>(data: T): HttpResponse<T> {
        return AppResponse.ok(data);
    }

    protected error(
        message: string,
        statusCode: number = 500,
        code?: string,
    ): HttpResponse {
        return AppResponse.error(message, statusCode, code);
    }

    protected badRequest(message: string, code?: string): HttpResponse {
        return AppResponse.badRequest(message, code);
    }

    protected unauthorized(
        message: string = 'Unauthorized',
        code?: string,
    ): HttpResponse {
        return AppResponse.unauthorized(message, code);
    }

    protected forbidden(
        message: string = 'Forbidden',
        code?: string,
    ): HttpResponse {
        return AppResponse.forbidden(message, code);
    }

    protected notFound(
        message: string = 'Not found',
        code?: string,
    ): HttpResponse {
        return AppResponse.notFound(message, code);
    }

    protected conflict(message: string, code?: string): HttpResponse {
        return AppResponse.conflict(message, code);
    }

    protected internalServerError(
        message: string = 'Internal server error',
        code?: string,
    ): HttpResponse {
        return AppResponse.internalServerError(message, code);
    }

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
            const statusCode = err.statusCode || 400;
            throw new HttpException(
                {
                    statusCode,
                    message: err.message,
                    ...(err.code && { code: err.code }),
                },
                statusCode,
            );
        }

        if (result.isOk() && result.value !== undefined) {
            return this.ok(result.value);
        }

        return this.ok(null);
    }
}

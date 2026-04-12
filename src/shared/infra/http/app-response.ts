/**
 * Interface para resposta de sucesso
 */
export interface SuccessResponse<T = unknown> {
  data: T;
}

/**
 * Interface para resposta de erro
 */
export interface ErrorResponse {
  error: {
    code?: string;
    message: string;
    statusCode: number;
  };
}

/**
 * Type da resposta HTTP
 */
export type HttpResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Classe abstrata para gerenciar respostas padronizadas
 */
export abstract class AppResponse {
  /**
   * Retorna uma resposta de sucesso
   */
  static ok<T>(data: T): SuccessResponse<T> {
    return { data };
  }

  /**
   * Retorna uma resposta de erro
   */
  static error(
    message: string,
    statusCode: number = 500,
    code?: string,
  ): ErrorResponse {
    return {
      error: {
        message,
        statusCode,
        ...(code && { code }),
      },
    };
  }

  /**
   * Retorna uma resposta de erro com validação (400)
   */
  static badRequest(message: string, code?: string): ErrorResponse {
    return this.error(message, 400, code);
  }

  /**
   * Retorna uma resposta de erro não autorizado (401)
   */
  static unauthorized(message: string = 'Unauthorized', code?: string): ErrorResponse {
    return this.error(message, 401, code);
  }

  /**
   * Retorna uma resposta de erro proibido (403)
   */
  static forbidden(message: string = 'Forbidden', code?: string): ErrorResponse {
    return this.error(message, 403, code);
  }

  /**
   * Retorna uma resposta de erro não encontrado (404)
   */
  static notFound(message: string = 'Not found', code?: string): ErrorResponse {
    return this.error(message, 404, code);
  }

  /**
   * Retorna uma resposta de erro conflito (409)
   */
  static conflict(message: string, code?: string): ErrorResponse {
    return this.error(message, 409, code);
  }

  /**
   * Retorna uma resposta de erro interno do servidor (500)
   */
  static internalServerError(
    message: string = 'Internal server error',
    code?: string,
  ): ErrorResponse {
    return this.error(message, 500, code);
  }

  /**
   * Verifica se uma resposta é de sucesso
   */
  static isSuccess<T>(response: HttpResponse<T>): response is SuccessResponse<T> {
    return 'data' in response;
  }

  /**
   * Verifica se uma resposta é de erro
   */
  static isError(response: HttpResponse<unknown>): response is ErrorResponse {
    return 'error' in response;
  }

  /**
   * Converte um Result<E, T> para HttpResponse automaticamente
   * Espera que o erro tenha propriedades: message, statusCode?, code?
   */
  static buildResponse<E extends { message: string; statusCode?: number; code?: string }, T>(
    result: { isErr(): boolean; isOk(): boolean; error?: E; value?: T },
  ): HttpResponse<T> {
    if (result.isErr() && result.error) {
      const err = result.error;
      return this.error(
        err.message,
        err.statusCode || 400,
        err.code,
      );
    }

    if (result.isOk() && result.value !== undefined) {
      return this.ok(result.value);
    }

    return this.ok(null as unknown as T);
  }
}

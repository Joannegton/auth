import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppResponse, HttpResponse } from './app-response';

/**
 * Interceptor que padroniza todas as respostas dos controllers
 *
 * Se o controller retornar um AppResponse.ok() ou AppResponse.error(),
 * a resposta é retornada como está.
 *
 * Se o controller retornar um objeto normal, ele é automaticamente
 * envolvido em AppResponse.ok()
 */
@Injectable()
export class AppResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<HttpResponse> {
        return next.handle().pipe(
            map((data) => {
                // Se já é uma resposta formatada (tem 'data' ou 'error')
                if (this.isFormattedResponse(data)) {
                    return data;
                }

                // Se é nulo ou undefined, retorna ok com o valor
                if (data === null || data === undefined) {
                    return AppResponse.ok(null);
                }

                // Se é um objeto normal, envolve em AppResponse.ok()
                return AppResponse.ok(data);
            }),
        );
    }

    private isFormattedResponse(data: unknown): data is HttpResponse {
        if (typeof data !== 'object' || data === null) {
            return false;
        }

        const obj = data as Record<string, unknown>;
        return 'data' in obj || 'error' in obj;
    }
}

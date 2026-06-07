import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                const statusCode = context.switchToHttp().getResponse().statusCode;
                this.logger.log(`${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip}`);
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                const statusCode = error.getStatus?.() || 500;
                this.logger.error(`${method} ${url} - ${statusCode} - ${duration}ms - IP: ${ip} - Error: ${error.message}`);
                throw error;
            }),
        );
    }
}

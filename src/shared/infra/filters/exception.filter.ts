import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import {
    BusinessException,
    RepositoryException,
    ServiceException,
    Exception,
} from 'src/shared/domain/exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code: string | undefined;

        if (exception instanceof BusinessException) {
            statusCode = exception.statusCode || HttpStatus.BAD_REQUEST;
            message = exception.message;
            code = exception.code;
            this.logger.warn(`Business exception: ${message}`);
        } else if (exception instanceof RepositoryException) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            this.logger.error(
                `Repository exception: ${message}`,
                exception.originalError,
            );
        } else if (exception instanceof ServiceException) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            this.logger.error(
                `Service exception: ${message}`,
                exception.originalError,
            );
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null
            ) {
                const response = exceptionResponse as any;
                message = response.message || exception.message;
                if (Array.isArray(message)) {
                    message = message.join(', ');
                }
            } else {
                message = exception.message;
            }
            this.logger.warn(`HTTP exception: ${message}`);
        } else if (exception instanceof Exception) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            this.logger.error(`Generic exception: ${message}`);
        } else if (exception instanceof Error) {
            message = exception.message || 'Unknown error';
            this.logger.error(`Unexpected error: ${message}`, exception);
        }

        response.status(statusCode).json({
            statusCode,
            message,
            ...(code && { code }),
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}

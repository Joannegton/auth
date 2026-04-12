import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface RequestInfo {
    ipAddress: string;
    userAgent: string;
}

export const ExtractRequestInfo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestInfo => {
        const request = ctx.switchToHttp().getRequest<Request>();

        return {
            ipAddress: request?.ip || 'unknown',
            userAgent: request?.get('user-agent') || 'unknown',
        };
    },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface RequestInfo {
    ipAddress: string;
    userAgent: string;
}

function extractIpAddress(request: Request): string {
    const xForwardedFor = request?.get('x-forwarded-for');
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map((ip) => ip.trim());
        if (ips[0] && ips[0] !== 'unknown') {
            return ips[0];
        }
    }

    const xRealIp = request?.get('x-real-ip');
    if (xRealIp && xRealIp !== 'unknown') {
        return xRealIp;
    }

    if (request?.ip && request.ip !== '::1' && request.ip !== '127.0.0.1') {
        return request.ip;
    }

    const remoteAddress = (request?.socket as any)?.remoteAddress;
    if (
        remoteAddress &&
        remoteAddress !== '::1' &&
        remoteAddress !== '127.0.0.1'
    ) {
        return remoteAddress;
    }

    return 'unknown';
}

export const ExtractRequestInfo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestInfo => {
        const request = ctx.switchToHttp().getRequest<Request>();

        return {
            ipAddress: extractIpAddress(request),
            userAgent: request?.get('user-agent') || 'unknown',
        };
    },
);

import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthTokens } from '../../infra/services/token-generator.service';

@Controller('auth/google')
export class GoogleAuthController {
    @Get()
    @UseGuards(ThrottlerGuard, AuthGuard('google'))
    googleAuth() {
        // Guard redireciona automaticamente para Google
    }

    @Get('callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(
        @Query('state') state: string,
        @Res() res: Response,
    ) {
        const authTokens = res.locals.authTokens as AuthTokens;

        if (!authTokens) {
            return res.status(400).json({
                ok: false,
                error: 'Falha na autenticação com Google.',
            });
        }

        const clientRedirectUrl =
            process.env.CLIENT_REDIRECT_URL ||
            'http://localhost:3000/auth/success';
        const tokenParams = new URLSearchParams({
            accessToken: authTokens.accessToken,
            refreshToken: authTokens.refreshToken,
            expiresIn: String(authTokens.expiresIn),
        }).toString();

        return res.redirect(`${clientRedirectUrl}?${tokenParams}`);
    }
}

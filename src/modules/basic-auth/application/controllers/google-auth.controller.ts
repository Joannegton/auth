import {
    Controller as NestController,
    Get,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
    GoogleLoginUseCase,
    type GoogleLoginInput,
} from '../usecases/google-login.usecase';
import {
    ExtractRequestInfo,
    type RequestInfo,
} from '../../domain/decorators/extract-request-info.decorator';
import { Controller } from 'src/shared/infra/http/controller';

@NestController('auth/google')
export class GoogleAuthController extends Controller {
    constructor(private readonly googleLoginUseCase: GoogleLoginUseCase) {
        super();
    }

    @Get()
    @UseGuards(ThrottlerGuard, AuthGuard('google'))
    googleAuth() {
        // Guard redireciona automaticamente para Google
    }

    @Get('callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(
        @Req() req: Request,
        @Res() res: Response,
        @ExtractRequestInfo() requestInfo: RequestInfo,
    ) {
        const profile = req.user as GoogleLoginInput;

        const result = await this.googleLoginUseCase.execute(
            profile,
            requestInfo,
        );

        if (result.isErr()) {
            const clientErrorUrl =
                process.env.CLIENT_REDIRECT_URL ||
                'http://localhost:3000/auth/error';
            return res.redirect(
                `${clientErrorUrl}?error=${encodeURIComponent(result.error.message)}`,
            );
        }

        const { accessToken, refreshToken, expiresIn } = result.value;
        const clientRedirectUrl =
            process.env.CLIENT_REDIRECT_URL ||
            'http://localhost:3000/auth/success';
        const tokenParams = new URLSearchParams({
            accessToken,
            refreshToken,
            expiresIn: String(expiresIn),
        }).toString();

        return res.redirect(`${clientRedirectUrl}?${tokenParams}`);
    }
}

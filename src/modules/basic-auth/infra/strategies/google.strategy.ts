import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { Request } from 'express';
import type { GoogleLoginInput } from '../../application/usecases/google-login.usecase';

interface GoogleProfile {
    id: string;
    displayName: string;
    emails: Array<{ value: string; verified: boolean }>;
    photos: Array<{ value: string }>;
    _json?: {
        email: string;
        name: string;
        picture: string;
    };
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });

        if (
            !process.env.GOOGLE_CLIENT_ID ||
            !process.env.GOOGLE_CLIENT_SECRET
        ) {
            this.logger.warn('Google OAuth não configurado.');
        }
    }

    async validate(
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
    ): Promise<GoogleLoginInput> {
        const email = profile.emails?.[0]?.value ?? profile._json?.email;

        if (!email) {
            this.logger.warn(
                `[GoogleStrategy] Profile sem email: ${profile.id}`,
            );
            throw new UnauthorizedException('Email é obrigatório');
        }

        return {
            googleId: profile.id,
            email,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            serviceId: req.query?.serviceId as string,
        };
    }
}

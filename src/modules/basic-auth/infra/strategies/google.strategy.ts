import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleLoginUseCase } from '../../application/usecases/google-login.usecase';
import { AuthTokens } from '../services/token-generator.service';

export interface GoogleProfile {
    id: string;
    email: string;
    displayName: string;
    photos: Array<{ value: string }>;
    name: {
        familyName: string;
        givenName: string;
    };
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

    constructor(private readonly googleLoginUseCase: GoogleLoginUseCase) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
            passReqToCallback: false,
        });

        if (
            !process.env.GOOGLE_CLIENT_ID ||
            !process.env.GOOGLE_CLIENT_SECRET
        ) {
            this.logger.warn('Google OAuth não configurado.');
        }
    }

    async validate(
        profile: GoogleProfile,
        done: VerifyCallback,
    ): Promise<void> {
        try {
            this.logger.log(`[Google] Validating profile: ${profile.email}`);

            const result = await this.googleLoginUseCase.execute(
                {
                    googleId: profile.id,
                    email: profile.email,
                    displayName: profile.displayName,
                    avatarUrl: profile.photos?.[0]?.value,
                },
                'unknown', // IP will be captured in controller
                'unknown', // User-Agent will be captured in controller
            );

            if (result.isErr()) {
                const errorMsg =
                    result.error.message || 'Authentication failed';
                this.logger.error(`[Google] Auth failed: ${errorMsg}`);
                return done(new Error(errorMsg));
            }

            // Return the tokens as the user object
            // The controller will extract this
            this.logger.log(`[Google] Auth successful for: ${profile.email}`);
            done(null, result.value as any);
        } catch (error) {
            this.logger.error('Google auth error:', error);
            done(error as Error);
        }
    }
}

import { Entity } from 'src/shared/domain/entity';
import { R, Result } from 'src/shared/domain/result';
import { SessionException } from './exceptions/session.exception';
import { DateLx } from 'src/shared/domain/value-objects/date';

export interface CreateSessionProps {
    refreshToken: string;
    expiresAt: number;
    userAgent?: string;
    infinity?: boolean;
}

export interface SessionProps {
    refreshToken: string;
    expiresAt: Date;
    isRevoked: boolean;
    userAgent?: string;
    infinity?: boolean;
}

export class Session extends Entity<SessionProps> {
    constructor(id?: string) {
        super(id);
    }

    static create(
        props: CreateSessionProps,
    ): Result<SessionException, Session> {
        const instance = new Session();

        const refreshTokenResult = instance.setRefreshToken(props.refreshToken);
        const expiresAtResult = instance.setExpiresAt(props.expiresAt);

        instance.setInfinity(props.infinity);
        instance.setUserAgent(props.userAgent);
        instance.setIsRevoked(false);

        return R.getResult([refreshTokenResult, expiresAtResult], instance);
    }

    static build(
        props: SessionProps,
        id?: string,
    ): Result<SessionException, Session> {
        const instance = new Session(id);

        const refreshTokenResult = instance.setRefreshToken(props.refreshToken);

        const expiresAt =
            props.expiresAt instanceof Date
                ? props.expiresAt.getTime()
                : props.expiresAt;
        const expiresAtResult = instance.setExpiresAt(expiresAt);

        instance.setIsRevoked(props.isRevoked);
        instance.setUserAgent(props.userAgent);

        return R.getResult([refreshTokenResult, expiresAtResult], instance);
    }

    isValid(): boolean {
        const dateNow = DateLx.create(new Date());
        const dateExpiresAt = DateLx.create(this.props.expiresAt);
        return (
            !this.props.isRevoked &&
            (dateNow.isBefore(dateExpiresAt) || !!this.props.infinity)
        );
    }

    revoke(): void {
        this.props.isRevoked = true;
    }

    get refreshToken(): string {
        return this.props.refreshToken;
    }

    get expiresAt(): Date {
        return this.props.expiresAt;
    }

    get isRevoked(): boolean {
        return this.props.isRevoked;
    }

    get userAgent(): string | undefined {
        return this.props.userAgent;
    }

    get infinity(): boolean | undefined {
        return this.props.infinity;
    }

    private setRefreshToken(
        refreshToken: string,
    ): Result<SessionException, void> {
        if (!refreshToken) {
            return R.error(new SessionException('Refresh token is required'));
        }
        this.props.refreshToken = refreshToken;
        return R.ok();
    }

    private setExpiresAt(timestamp: number): Result<SessionException, void> {
        if (!timestamp || Number.isNaN(timestamp)) {
            return R.error(new SessionException('Expiration date is required'));
        }
        this.props.expiresAt = new Date(timestamp);
        return R.ok();
    }

    private setIsRevoked(isRevoked?: boolean): void {
        this.props.isRevoked = isRevoked ?? false;
    }

    private setUserAgent(userAgent?: string): void {
        this.props.userAgent = userAgent;
    }

    private setInfinity(infinity?: boolean): void {
        this.props.infinity = infinity ?? false;
    }
}

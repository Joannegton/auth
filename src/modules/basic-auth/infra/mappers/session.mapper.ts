import { R, Result } from 'src/shared/domain/result';
import { Session } from '../../domain/session';
import { SessionModel } from '../models/session.model';
import { SessionException } from '../../domain/exceptions/session.exception';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionMapper {
    toDomain(sessionModel: SessionModel): Result<SessionException, Session> {
        const domain = Session.build(
            {
                refreshToken: sessionModel.refreshToken,
                expiresAt: sessionModel.expiresAt,
                isRevoked: sessionModel.isRevoked,
                userAgent: sessionModel.userAgent,
            },
            sessionModel.id,
        );

        if (domain.isErr()) return R.error(domain.error);

        return R.ok(domain.value);
    }

    toModel(session: Session, userId?: string): SessionModel {
        const sessionModel = SessionModel.build({
            id: session.id.toString(),
            refreshToken: session.refreshToken,
            expiresAt: session.expiresAt,
            isRevoked: session.isRevoked,
            userAgent: session.userAgent,
            userId: userId || '',
        });
        return sessionModel;
    }

    toDomainList(
        sessionModels: SessionModel[],
    ): Result<SessionException, Session[]> {
        const sessions: Session[] = [];
        for (const model of sessionModels) {
            const sessionResult = this.toDomain(model);
            if (sessionResult.isErr()) return R.error(sessionResult.error);
            sessions.push(sessionResult.value);
        }
        return R.ok(sessions);
    }

    toModelList(sessions?: Session[]): SessionModel[] {
        return sessions ? sessions.map((session) => this.toModel(session)) : [];
    }
}

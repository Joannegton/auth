import {
    Entity,
    Column,
    ManyToOne,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { UserModel } from './user.model';
import { Model } from '../../../../shared/domain/model';

export interface SessionProps {
    id: string;
    refreshToken: string;
    userId: string;
    expiresAt: Date;
    isRevoked: boolean;
    userAgent?: string;
    infinity?: boolean;
    user?: UserModel;
    createdAt?: Date;
    updatedAt?: Date;
}

@Entity('sessions')
export class SessionModel extends Model<SessionProps> implements SessionProps {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'refresh_token', type: 'varchar', length: 2048, unique: true })
    refreshToken: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => UserModel, (user) => user.sessions, {
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'revoked', type: 'boolean', default: false })
    isRevoked: boolean;

    @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
    userAgent: string;

    @Column({ name: 'infinity', type: 'boolean', default: false })
    infinity: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

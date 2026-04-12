import {
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    OneToMany,
} from 'typeorm';
import { UserRoleModel } from './user-roles.model';
import { SessionModel } from './session.model';
import { Model } from '../../../../shared/domain/model';

export interface UserProps {
    id: string;
    email: string;
    password?: string;
    googleId?: string;
    provider: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt?: Date;
    roles: UserRoleModel[];
    sessions: SessionModel[];
}

@Entity('users')
export class UserModel extends Model<UserProps> implements UserProps {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'email', type: 'varchar', unique: true })
    email: string;

    @Column({ name: 'password', select: false, nullable: true })
    password: string;

    @Column({ name: 'google_id', nullable: true, unique: true })
    googleId: string;

    @Column({ name: 'provider', default: 'local' })
    provider: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl: string;

    @OneToMany(() => SessionModel, (session) => session.user, {
        cascade: ['insert', 'update'],
        orphanedRowAction: 'delete',
        eager: false,
        lazy: false,
    })
    sessions: SessionModel[];

    @OneToMany(() => UserRoleModel, (userRole) => userRole.user, {
        cascade: ['insert', 'update'],
        orphanedRowAction: 'delete',
        eager: false,
        lazy: false,
    })
    roles: UserRoleModel[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}

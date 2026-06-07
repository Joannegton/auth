import {
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Entity,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserRoleModel } from './user-roles.model';
import { SessionModel } from './session.model';
import { ServiceModel } from './service.model';
import { Model } from '../../../../shared/domain/model';

export interface UserProps {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    password?: string;
    googleId?: string;
    provider: string;
    avatarUrl?: string;
    serviceId: string;
    createdAt: Date;
    updatedAt?: Date;
    roles: UserRoleModel[];
    sessions: SessionModel[];
}

@Entity('users')
export class UserModel extends Model<UserProps> implements UserProps {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'email', type: 'varchar' })
    email: string;

    @Column({ name: 'name', type: 'varchar', nullable: true })
    name: string;

    @Column({ name: 'phone', type: 'varchar', nullable: true })
    phone: string;

    @Column({ name: 'password', select: false, nullable: true })
    password: string;

    @Column({ name: 'google_id', nullable: true, unique: true })
    googleId: string;

    @Column({ name: 'provider', default: 'local' })
    provider: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl: string;

    @Column({ name: 'service_id', type: 'uuid' })
    serviceId: string;

    @ManyToOne(() => ServiceModel, (service) => service.users, {
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'service_id' })
    service: ServiceModel;

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

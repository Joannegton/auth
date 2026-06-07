import {
    Entity,
    ManyToOne,
    Column,
    CreateDateColumn,
    PrimaryColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { UserModel } from './user.model';
import { RoleModel } from './role.model';
import { ServiceModel } from './service.model';
import { Model } from '../../../../shared/domain/model';

export interface UserRoleProps {
    id: string;
    userId: string;
    roleId: string;
    roleIdNum: number;
    serviceId: string;
    assignedAt: Date;
    createdAt?: Date;
}

@Entity('user_roles')
@Index(['userId', 'roleId', 'serviceId'], { unique: true })
export class UserRoleModel
    extends Model<UserRoleProps>
    implements UserRoleProps
{
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'role_id', type: 'uuid' })
    roleId: string;

    @Column({ name: 'role_id_num', type: 'smallint' })
    roleIdNum: number;

    @ManyToOne(() => UserModel, (user) => user.roles, {
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @ManyToOne(() => RoleModel, (role) => role.userRoles, {
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn([
        { name: 'role_id', referencedColumnName: 'id' },
        { name: 'role_id_num', referencedColumnName: 'idNum' },
    ])
    role: RoleModel;

    @ManyToOne(() => ServiceModel, {
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'service_id' })
    service: ServiceModel;

    @Column({ name: 'service_id', type: 'uuid' })
    serviceId: string;

    @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
    assignedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

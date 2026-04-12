import {
    Entity,
    Column,
    OneToMany,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRoleModel } from './user-roles.model';
import { Model } from 'src/shared/domain/model';

export interface RoleProps {
    id: string;
    idNum: number;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Entity('roles')
export class RoleModel extends Model<RoleProps> implements RoleProps {
    @PrimaryColumn('uuid')
    id: string;

    @PrimaryColumn('smallint', { name: 'id_num' })
    idNum: number;

    @Column({ name: 'name', type: 'varchar', unique: true })
    name: string;

    @Column({ name: 'description', type: 'varchar', nullable: true })
    description: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => UserRoleModel, (userRole) => userRole.role, {
        orphanedRowAction: 'delete',
        eager: false,
        lazy: false,
    })
    userRoles: UserRoleModel[];
}

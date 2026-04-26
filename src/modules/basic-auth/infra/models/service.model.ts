import {
    PrimaryColumn,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
} from 'typeorm';
import { UserModel } from './user.model';
import { Model } from '../../../../shared/domain/model';

export interface ServiceProps {
    id: string;
    name: string;
    apiKey: string;
    createdAt: Date;
}

@Entity('services')
export class ServiceModel extends Model<ServiceProps> implements ServiceProps {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'name', type: 'varchar', unique: true })
    name: string;

    @Column({ name: 'api_key', type: 'varchar', unique: true })
    apiKey: string;

    @OneToMany(() => UserModel, (user) => user.service, {
        orphanedRowAction: 'delete',
        eager: false,
        lazy: false,
    })
    users: UserModel[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

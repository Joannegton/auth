import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('password_reset_codes')
@Index(['userId', 'serviceId'])
export class PasswordResetCodeModel {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'service_id', type: 'uuid' })
    serviceId: string;

    @Column({ name: 'code_hash', type: 'varchar' })
    codeHash: string;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
    usedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

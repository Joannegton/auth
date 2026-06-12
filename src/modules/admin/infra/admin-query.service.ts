import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../../basic-auth/infra/models/user.model';
import { SessionModel } from '../../basic-auth/infra/models/session.model';
import { RoleModel } from '../../basic-auth/infra/models/role.model';
import { ServiceModel } from '../../basic-auth/infra/models/service.model';
import { UserRoleModel } from '../../basic-auth/infra/models/user-roles.model';

export interface AdminUserListItem {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    provider: string;
    serviceId: string;
    serviceName: string;
    avatarUrl: string | null;
    roles: { idNum: number; name: string }[];
    createdAt: Date;
    deletedAt: Date | null;
}

export interface AdminUserDetail extends AdminUserListItem {
    googleId: string | null;
    sessions: {
        id: string;
        userAgent: string | null;
        expiresAt: Date;
        isRevoked: boolean;
        createdAt: Date;
    }[];
}

export interface AdminUserListResult {
    data: AdminUserListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminSessionListItem {
    id: string;
    userId: string;
    userEmail: string;
    userAgent: string | null;
    expiresAt: Date;
    isRevoked: boolean;
    infinity: boolean;
    createdAt: Date;
}

export interface AdminSessionListResult {
    data: AdminSessionListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminDashboardStats {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
    totalServices: number;
    totalRoles: number;
    recentUsers: AdminUserListItem[];
}

@Injectable()
export class AdminQueryService {
    private readonly logger = new Logger(AdminQueryService.name);

    constructor(
        @InjectRepository(UserModel)
        private readonly userRepo: Repository<UserModel>,

        @InjectRepository(SessionModel)
        private readonly sessionRepo: Repository<SessionModel>,

        @InjectRepository(RoleModel)
        private readonly roleRepo: Repository<RoleModel>,

        @InjectRepository(ServiceModel)
        private readonly serviceRepo: Repository<ServiceModel>,

        @InjectRepository(UserRoleModel)
        private readonly userRoleRepo: Repository<UserRoleModel>,
    ) {}

    async listUsers(params: {
        page: number;
        limit: number;
        serviceId?: string;
        roleIdNum?: number;
        search?: string;
        includeDeleted?: boolean;
    }): Promise<AdminUserListResult> {
        const { page, limit, serviceId, roleIdNum, search, includeDeleted } = params;
        const skip = (page - 1) * limit;

        const qb = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'userRole')
            .leftJoinAndSelect('userRole.role', 'role')
            .leftJoinAndSelect('user.service', 'service')
            .take(limit)
            .skip(skip)
            .orderBy('user.createdAt', 'DESC');

        if (includeDeleted) {
            qb.withDeleted();
        }

        if (serviceId) {
            qb.andWhere('user.serviceId = :serviceId', { serviceId });
        }

        if (search) {
            qb.andWhere(
                '(LOWER(user.email) LIKE :search OR LOWER(user.name) LIKE :search)',
                { search: `%${search.toLowerCase()}%` },
            );
        }

        if (roleIdNum) {
            qb.andWhere('userRole.roleIdNum = :roleIdNum', { roleIdNum });
        }

        const [users, total] = await qb.getManyAndCount();

        return {
            data: users.map((u) => this.mapUserToListItem(u)),
            total,
            page,
            limit,
        };
    }

    async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
        const user = await this.userRepo
            .createQueryBuilder('user')
            .withDeleted()
            .where('user.id = :userId', { userId })
            .leftJoinAndSelect('user.roles', 'userRole')
            .leftJoinAndSelect('userRole.role', 'role')
            .leftJoinAndSelect('user.service', 'service')
            .getOne();

        if (!user) return null;

        const sessions = await this.sessionRepo.find({
            where: { userId: user.id },
            order: { createdAt: 'DESC' },
            take: 20,
        });

        return {
            ...this.mapUserToListItem(user),
            googleId: user.googleId ?? null,
            sessions: sessions.map((s) => ({
                id: s.id,
                userAgent: s.userAgent ?? null,
                expiresAt: s.expiresAt,
                isRevoked: s.isRevoked,
                createdAt: s.createdAt,
            })),
        };
    }

    async addUserRole(params: {
        userId: string;
        roleIdNum: number;
        serviceId: string;
    }): Promise<void> {
        const role = await this.roleRepo.findOne({
            where: { idNum: params.roleIdNum },
        });
        if (!role) throw new Error(`Role ${params.roleIdNum} não encontrada`);

        const existing = await this.userRoleRepo.findOne({
            where: {
                userId: params.userId,
                roleId: role.id,
                serviceId: params.serviceId,
            },
        });
        if (existing) return;

        await this.userRoleRepo.save({
            id: uuidv4(),
            userId: params.userId,
            roleId: role.id,
            roleIdNum: role.idNum,
            serviceId: params.serviceId,
        });
    }

    async removeUserRole(params: {
        userId: string;
        roleIdNum: number;
        serviceId: string;
    }): Promise<void> {
        const role = await this.roleRepo.findOne({
            where: { idNum: params.roleIdNum },
        });
        if (!role) return;

        await this.userRoleRepo.delete({
            userId: params.userId,
            roleId: role.id,
            serviceId: params.serviceId,
        });
    }

    async softDeleteUser(userId: string): Promise<void> {
        await this.userRepo.softDelete(userId);
        await this.sessionRepo.update(
            { userId },
            { isRevoked: true },
        );
    }

    async restoreUser(userId: string): Promise<void> {
        await this.userRepo.restore(userId);
    }

    async listSessions(params: {
        page: number;
        limit: number;
        userId?: string;
        activeOnly?: boolean;
    }): Promise<AdminSessionListResult> {
        const { page, limit, userId, activeOnly } = params;
        const skip = (page - 1) * limit;

        const qb = this.sessionRepo
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.user', 'user')
            .take(limit)
            .skip(skip)
            .orderBy('session.createdAt', 'DESC');

        if (userId) {
            qb.andWhere('session.userId = :userId', { userId });
        }

        if (activeOnly) {
            qb.andWhere('session.isRevoked = false')
                .andWhere('session.expiresAt > NOW()');
        }

        const [sessions, total] = await qb.getManyAndCount();

        return {
            data: sessions.map((s) => ({
                id: s.id,
                userId: s.userId,
                userEmail: s.user?.email ?? '',
                userAgent: s.userAgent ?? null,
                expiresAt: s.expiresAt,
                isRevoked: s.isRevoked,
                infinity: s.infinity,
                createdAt: s.createdAt,
            })),
            total,
            page,
            limit,
        };
    }

    async revokeSession(sessionId: string): Promise<void> {
        await this.sessionRepo.update(sessionId, { isRevoked: true });
    }

    async revokeAllUserSessions(userId: string): Promise<void> {
        await this.sessionRepo.update({ userId }, { isRevoked: true });
    }

    async listServices(): Promise<ServiceModel[]> {
        return this.serviceRepo.find({ order: { createdAt: 'DESC' } });
    }

    async createService(name: string): Promise<ServiceModel> {
        const service = this.serviceRepo.create({
            id: uuidv4(),
            name,
            apiKey: randomBytes(32).toString('hex'),
        });
        return this.serviceRepo.save(service);
    }

    async listRoles(): Promise<RoleModel[]> {
        return this.roleRepo.find({ order: { idNum: 'ASC' } });
    }

    async getDashboardStats(): Promise<AdminDashboardStats> {
        const [totalUsers, activeUsers, activeSessions, totalServices, totalRoles] =
            await Promise.all([
                this.userRepo.count(),
                this.userRepo.count({ where: { deletedAt: IsNull() } }),
                this.sessionRepo.count({
                    where: { isRevoked: false },
                }),
                this.serviceRepo.count(),
                this.roleRepo.count(),
            ]);

        const recentUsersRaw = await this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'userRole')
            .leftJoinAndSelect('userRole.role', 'role')
            .leftJoinAndSelect('user.service', 'service')
            .orderBy('user.createdAt', 'DESC')
            .take(5)
            .getMany();

        return {
            totalUsers,
            activeUsers,
            activeSessions,
            totalServices,
            totalRoles,
            recentUsers: recentUsersRaw.map((u) => this.mapUserToListItem(u)),
        };
    }

    private mapUserToListItem(user: UserModel): AdminUserListItem {
        return {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            phone: user.phone ?? null,
            provider: user.provider,
            serviceId: user.serviceId,
            serviceName: user.service?.name ?? '',
            avatarUrl: user.avatarUrl ?? null,
            roles: (user.roles ?? []).map((ur) => ({
                idNum: ur.roleIdNum,
                name: ur.role?.name ?? '',
            })),
            createdAt: user.createdAt,
            deletedAt: user.deletedAt ?? null,
        };
    }
}

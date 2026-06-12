import {
    Controller as NestController,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    NotFoundException,
    ParseUUIDPipe,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { Controller } from 'src/shared/infra/http/controller';
import { JwtAuthGuard } from 'src/shared/infra/guards/jwt-auth.guard';
import { RoleGuard, RequireRoles } from 'src/shared/infra/guards/role.guard';
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';
import { AdminQueryService } from '../../infra/admin-query.service';

class UpdateUserRolesDto {
    roleIdNum: number;
    serviceId: string;
    action: 'add' | 'remove';
}

class CreateServiceDto {
    name: string;
}

@NestController('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRoles(ROLES.OWNER)
export class AdminController extends Controller {
    constructor(private readonly adminService: AdminQueryService) {
        super();
    }

    @Get('stats')
    @HttpCode(HttpStatus.OK)
    async getDashboardStats() {
        const stats = await this.adminService.getDashboardStats();
        return this.ok(stats);
    }

    @Get('users')
    @HttpCode(HttpStatus.OK)
    async listUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('serviceId') serviceId?: string,
        @Query('roleIdNum', new DefaultValuePipe(0), ParseIntPipe) roleIdNum?: number,
        @Query('search') search?: string,
        @Query('includeDeleted') includeDeleted?: string,
    ) {
        const result = await this.adminService.listUsers({
            page,
            limit: Math.min(limit, 100),
            serviceId: serviceId || undefined,
            roleIdNum: roleIdNum || undefined,
            search: search || undefined,
            includeDeleted: includeDeleted === 'true',
        });
        return this.ok(result);
    }

    @Get('users/:id')
    @HttpCode(HttpStatus.OK)
    async getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.adminService.getUserDetail(id);
        if (!user) throw new NotFoundException('Usuário não encontrado');
        return this.ok(user);
    }

    @Patch('users/:id/roles')
    @HttpCode(HttpStatus.OK)
    async updateUserRoles(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserRolesDto,
    ) {
        if (dto.action === 'add') {
            await this.adminService.addUserRole({
                userId: id,
                roleIdNum: dto.roleIdNum,
                serviceId: dto.serviceId,
            });
        } else {
            await this.adminService.removeUserRole({
                userId: id,
                roleIdNum: dto.roleIdNum,
                serviceId: dto.serviceId,
            });
        }
        return this.ok({ updated: true });
    }

    @Delete('users/:id')
    @HttpCode(HttpStatus.OK)
    async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.softDeleteUser(id);
        return this.ok({ deleted: true });
    }

    @Post('users/:id/restore')
    @HttpCode(HttpStatus.OK)
    async restoreUser(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.restoreUser(id);
        return this.ok({ restored: true });
    }

    @Get('sessions')
    @HttpCode(HttpStatus.OK)
    async listSessions(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        const result = await this.adminService.listSessions({
            page,
            limit: Math.min(limit, 100),
            userId: userId || undefined,
            activeOnly: activeOnly === 'true',
        });
        return this.ok(result);
    }

    @Delete('sessions/:id')
    @HttpCode(HttpStatus.OK)
    async revokeSession(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.revokeSession(id);
        return this.ok({ revoked: true });
    }

    @Delete('users/:id/sessions')
    @HttpCode(HttpStatus.OK)
    async revokeAllUserSessions(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.revokeAllUserSessions(id);
        return this.ok({ revoked: true });
    }

    @Get('services')
    @HttpCode(HttpStatus.OK)
    async listServices() {
        const services = await this.adminService.listServices();
        return this.ok(services);
    }

    @Post('services')
    @HttpCode(HttpStatus.CREATED)
    async createService(@Body() dto: CreateServiceDto) {
        const service = await this.adminService.createService(dto.name);
        return this.ok(service);
    }

    @Get('roles')
    @HttpCode(HttpStatus.OK)
    async listRoles() {
        const roles = await this.adminService.listRoles();
        return this.ok(roles);
    }
}

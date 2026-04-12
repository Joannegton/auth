import { User } from '../../domain/user';

export interface UserDTO {
    id: string;
    email: string;
    provider: string;
    createdAt: Date;
    updatedAt?: Date;
    userRole: UserRoleListDTO[];
}

export interface UserRoleListDTO {
    id: string;
    role: RoleDto;
}

export interface RoleDto {
    id: string;
    name: string;
    description?: string;
}

export class UserMapper {
    static toDTO(user: User): UserDTO {
        return {
            id: user.id.toString(),
            email: user.email,
            provider: user.provider,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            userRole: user.userRoleList.map((userRole) => ({
                id: userRole.id.toString(),
                role: {
                    id: userRole.role.id.toString(),
                    name: userRole.role.name,
                    description: userRole.role.description,
                },
            })),
        };
    }
}

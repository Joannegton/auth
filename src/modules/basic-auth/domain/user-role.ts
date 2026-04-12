import { Entity } from 'src/shared/domain/entity';
import { R, Result } from 'src/shared/domain/result';
import { UserRoleException } from './exceptions/user-role.exception';
import { Role } from './role';

export type CreateUserRoleProps = {
    userId?: string;
    role: Role;
};

export type UserRoleProps = {
    userId: string;
    role: Role;
    assignedAt: Date;
};

export class UserRole extends Entity<UserRoleProps> {
    constructor(id?: string) {
        super(id);
    }

    static create(
        props: CreateUserRoleProps,
    ): Result<UserRoleException, UserRole> {
        const instance = new UserRole();

        const setUserIdResult = instance.setUserId(props.userId || 'temp');
        const setRoleResult = instance.setRole(props.role);

        return R.getResult([setUserIdResult, setRoleResult], instance);
    }

    static build(
        props: UserRoleProps,
        id: string,
    ): Result<UserRoleException, UserRole> {
        const instance = new UserRole(id);

        const setUserIdResult = instance.setUserId(props.userId);
        const setRoleIdResult = instance.setRole(props.role);
        instance.props.assignedAt = props.assignedAt;

        return R.getResult([setUserIdResult, setRoleIdResult], instance);
    }

    get userId(): string {
        return this.props.userId;
    }

    get assignedAt(): Date {
        return this.props.assignedAt;
    }

    get role(): Role {
        return this.props.role;
    }

    private setUserId(userId: string): Result<UserRoleException, void> {
        if (!userId || userId.trim() === '') {
            return R.error(new UserRoleException('User ID é obrigatório'));
        }
        this.props.userId = userId;
        return R.ok();
    }

    private setRole(role: Role): Result<UserRoleException, void> {
        if (!role) {
            return R.error(new UserRoleException('Role é obrigatório'));
        }
        this.props.role = role;
        return R.ok();
    }
}

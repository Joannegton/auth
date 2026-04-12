import { AggregateRoot } from 'src/shared/domain/aggregate';
import { R, Result } from 'src/shared/domain/result';
import { RoleException } from './exceptions/role.exception';
import { RolePk } from './role-pk.vo';
import { ROLES } from './constants/roles.constants';

// Re-exportar ROLES para manter compatibilidade
export {
    ROLES,
    ROLE_NAMES,
    ROLE_DESCRIPTIONS,
} from './constants/roles.constants';
export type { RoleId } from './constants/roles.constants';

export type RoleProps = {
    idNum: number;
    name: string;
    description?: string;
};

export class Role extends AggregateRoot<RoleProps> {
    private constructor(id?: RolePk) {
        super(id);
    }

    static create(props: RoleProps): Result<RoleException, Role> {
        const rolePkResult = RolePk.create(props.idNum);
        if (rolePkResult.isErr()) return R.error(rolePkResult.error);

        const instance = new Role(rolePkResult.value);

        const setNameResult = instance.setName(props.name);
        instance.setDescription(props.description);

        return R.getResult([setNameResult], instance);
    }

    static build(
        props: RoleProps,
        id: string,
        idNum: number,
    ): Result<RoleException, Role> {
        const rolePk = RolePk.create(idNum, id);
        if (rolePk.isErr()) return R.error(rolePk.error);

        const instance = new Role(rolePk.value);

        const setNameResult = instance.setName(props.name);
        instance.setDescription(props.description);

        return R.getResult([setNameResult], instance);
    }

    isAdminOrModerator(): boolean {
        return (
            this.props.idNum === ROLES.ADMIN ||
            this.props.idNum === ROLES.MODERATOR
        );
    }

    get name(): string {
        return this.props.name;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    private setName(name: string): Result<RoleException, void> {
        if (!name || name.trim() === '') {
            return R.error(new RoleException('Role name é obrigatório'));
        }
        this.props.name = name;
        return R.ok();
    }

    private setDescription(description?: string): void {
        this.props.description = description;
    }
}

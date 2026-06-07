import { R, Result } from 'src/shared/domain/result';
import { UserException } from './exceptions/user.exception';
import { AggregateRoot } from 'src/shared/domain/aggregate';
import { UserRole } from './user-role';
import { CreateSessionProps, Session } from './session';
import { Role } from './role';
import { RolePk } from './role-pk.vo';
import { CompositeId } from 'src/shared/domain/value-objects/composite-id.vo';
import { DateLx } from 'src/shared/domain/value-objects/date';

export type CreateUserProps = Omit<
    UserProps,
    'sessions' | 'userRoles' | 'createdAt'
> & {
    role: Role;
};

export type UserProps = {
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
    userRoles: UserRole[];
    sessions?: Session[];
};

export class User extends AggregateRoot<UserProps> {
    constructor(id?: string) {
        super(id);
    }

    static create(props: CreateUserProps): Result<UserException, User> {
        const instance = new User();

        const setEmail = instance.setEmail(props.email);
        if (!props.googleId && !props.password) {
            return R.error(
                new UserException('Usuário deve ter senha ou googleId'),
            );
        }

        const setServiceId = instance.setServiceId(props.serviceId);

        instance.setName(props.name);
        instance.setPhone(props.phone);
        instance.setPassword(props.password);
        instance.setGoogleId(props.googleId);
        instance.setProvider(props.provider ?? 'local');
        instance.setAvatarUrl(props.avatarUrl);

        const userRole = UserRole.create({
            userId: instance.id.toString(),
            role: props.role,
            serviceId: props.serviceId,
        });
        if (userRole.isErr()) return R.error(userRole.error);

        const setRolesResult = instance.setUserRoles([userRole.value]);

        return R.getResult([setEmail, setRolesResult, setServiceId], instance);
    }

    static build(props: UserProps, id: string): Result<UserException, User> {
        const instance = new User(id);

        const setEmailResult = instance.setEmail(props.email);
        const setUserRoles = instance.setUserRoles(props.userRoles);
        const setServiceId = instance.setServiceId(props.serviceId);

        instance.setName(props.name);
        instance.setPhone(props.phone);
        instance.setPassword(props.password);
        instance.setGoogleId(props.googleId);
        instance.setProvider(props.provider);
        instance.setAvatarUrl(props.avatarUrl);
        instance.setSessions(props.sessions);
        instance.props.createdAt = props.createdAt;
        instance.props.updatedAt = props.updatedAt;

        return R.getResult(
            [setEmailResult, setUserRoles, setServiceId],
            instance,
        );
    }

    addGoogleInfo(googleId: string, avatarUrl?: string): void {
        this.setGoogleId(googleId);
        this.setProvider('google');
        this.setAvatarUrl(avatarUrl);
    }

    changePassword(hashedPassword: string): void {
        this.setPassword(hashedPassword);
        this.setProvider('local');
        this.props.updatedAt = new Date();
    }

    addSession(props: CreateSessionProps): Result<UserException, void> {
        this.revokeSession();

        const expiresAt = DateLx.create(
            Date.now() + props.expiresAt * 24 * 60 * 60 * 1000,
        ).toDateTime();

        const session = Session.create({
            refreshToken: props.refreshToken,
            expiresAt: expiresAt,
            userAgent: props.userAgent,
            infinity: props.infinity,
        });
        if (session.isErr()) return R.error(session.error);

        const addSession = this.setSession(session.value);
        if (addSession.isErr()) return R.error(addSession.error);

        return R.ok();
    }

    validateSession(refreshToken: string): boolean {
        if (!this.props.sessions || this.props.sessions.length === 0) {
            return false;
        }

        const session = this.props.sessions.find(
            (s) => s.refreshToken === refreshToken,
        );

        if (!session) {
            return false;
        }

        return session.isValid();
    }

    revokeSession(): void {
        const validSessions = this.props.sessions
            ? this.props.sessions?.filter((s) => s.isValid())
            : [];
        if (validSessions.length > 0) validSessions.forEach((s) => s.revoke());
    }

    isAdminOrModerator(): boolean {
        if (!this.props.userRoles || this.props.userRoles.length === 0) {
            return false;
        }
        return this.props.userRoles.some((ur) => {
            const role = ur.role;
            return role.isAdminOrModerator();
        });
    }

    getHighestRole(): Result<UserException, Role> {
        if (!this.props.userRoles || this.props.userRoles.length === 0) {
            return R.error(
                new UserException('Usuário não tem papéis atribuídos'),
            );
        }
        return R.ok(
            this.props.userRoles.reduce((highest, current) => {
                const currentRoleId = current.role.id as CompositeId<RolePk>;
                const highestRoleId = highest.role.id as CompositeId<RolePk>;

                return currentRoleId.ids.idNum < highestRoleId.ids.idNum
                    ? current
                    : highest;
            }).role,
        );
    }

    getIdsNumUserRolesService(
        serviceId: string,
    ): Result<UserException, number[]> {
        const roleIds = this.props.userRoles
            .filter((ur) => ur.serviceId === serviceId)
            .map((ur) => ur.role.id as CompositeId<RolePk>);

        if (roleIds.length === 0) {
            return R.error(new UserException('Usuário não tem papéis'));
        }

        const roleIdsNum = roleIds.map((id) => id.ids.idNum);

        return R.ok(roleIdsNum);
    }

    get email(): string {
        return this.props.email;
    }

    get name(): string | undefined {
        return this.props.name;
    }

    get phone(): string | undefined {
        return this.props.phone;
    }

    get password(): string | undefined {
        return this.props.password;
    }

    get googleId(): string | undefined {
        return this.props.googleId;
    }

    get provider(): string {
        return this.props.provider;
    }

    get avatarUrl(): string | undefined {
        return this.props.avatarUrl;
    }

    get serviceId(): string {
        return this.props.serviceId;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    get userRoleList(): UserRole[] {
        return this.props.userRoles;
    }

    get sessions(): Session[] | undefined {
        return this.props.sessions;
    }

    private setEmail(email: string): Result<UserException, void> {
        if (!email || email.trim() === '') {
            return R.error(new UserException('Email é obrigatório'));
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(normalizedEmail)) {
            return R.error(new UserException('Email inválido'));
        }

        if (normalizedEmail.length > 254) {
            return R.error(
                new UserException(
                    'Email é muito longo (máximo 254 caracteres)',
                ),
            );
        }

        this.props.email = normalizedEmail;
        return R.ok();
    }

    private setName(name?: string): void {
        this.props.name = name?.trim() || undefined;
    }

    private setPhone(phone?: string): void {
        this.props.phone = phone?.trim() || undefined;
    }

    private setPassword(password?: string): void {
        this.props.password = password;
    }

    private setGoogleId(googleId?: string): void {
        this.props.googleId = googleId;
    }

    private setProvider(provider: string): void {
        const validProviders = ['local', 'google', 'apple'];
        if (!validProviders.includes(provider)) {
            this.props.provider = 'local';
            return;
        }
        this.props.provider = provider;
    }

    private setAvatarUrl(avatarUrl?: string): void {
        this.props.avatarUrl = avatarUrl;
    }

    private setServiceId(serviceId: string): Result<UserException, void> {
        if (!serviceId)
            return R.error(new UserException('Usuario deve ter serviço'));

        this.props.serviceId = serviceId;
        return R.ok();
    }

    private setUserRoles(userRoles: UserRole[]): Result<UserException, void> {
        if (!userRoles || userRoles.length === 0) {
            return R.error(
                new UserException('Usuário deve ter pelo menos um papel'),
            );
        }
        this.props.userRoles = userRoles;
        return R.ok();
    }

    private setSession(session: Session): Result<UserException, void> {
        if (!session)
            return R.error(new UserException('Deve ter session para inserir'));

        this.props.sessions ??= [];
        this.props.sessions.push(session);
        return R.ok();
    }

    private setSessions(sessions?: Session[]): void {
        this.props.sessions = sessions;
    }
}

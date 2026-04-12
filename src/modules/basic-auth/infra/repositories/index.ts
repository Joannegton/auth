import { RoleRepositoryImpl } from './role.repository';
import { UserRepositoryImpl } from './user.repository';
import { SessionRepositoryImpl } from './session.repository';

export const Repositories = [
    {
        provide: 'UserRepository',
        useClass: UserRepositoryImpl,
    },
    {
        provide: 'RoleRepository',
        useClass: RoleRepositoryImpl,
    },
    {
        provide: 'SessionRepository',
        useClass: SessionRepositoryImpl,
    },
];

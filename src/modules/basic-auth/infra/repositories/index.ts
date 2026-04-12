import { RoleRepositoryImpl } from './role.repository';
import { UserRepositoryImpl } from './user.repository';

export const Repositories = [
    {
        provide: 'UserRepository',
        useClass: UserRepositoryImpl,
    },
    {
        provide: 'RoleRepository',
        useClass: RoleRepositoryImpl,
    },
];

import { RoleRepositoryImpl } from './role.repository';
import { UserRepositoryImpl } from './user.repository';
import { ServiceRepositoryImpl } from './service.repository';

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
        provide: 'ServiceRepository',
        useClass: ServiceRepositoryImpl,
    },
];

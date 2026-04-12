import { BusinessException } from 'src/shared/domain/exceptions';

export class UserWithoutPermissionException extends BusinessException {
    constructor(message?: string) {
        super(
            message || 'Usuario não tem permissão para acessar este recurso',
            'USER_WITHOUT_PERMISSION',
        );
    }
}

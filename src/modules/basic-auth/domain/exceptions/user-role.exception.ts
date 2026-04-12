import { Exception } from 'src/shared/domain/exceptions';

export class UserRoleException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'UserRoleException';
    }
}

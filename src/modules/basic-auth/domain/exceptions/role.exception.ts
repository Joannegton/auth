import { Exception } from 'src/shared/domain/exceptions';

export class RoleException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'RoleException';
    }
}

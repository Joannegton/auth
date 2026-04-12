import { Exception } from 'src/shared/domain/exceptions';

export class UserException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'UserException';
    }
}

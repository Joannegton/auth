import { Exception } from 'src/shared/domain/exceptions';

export class SessionInvalidException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'SessionInvalidException';
    }
}

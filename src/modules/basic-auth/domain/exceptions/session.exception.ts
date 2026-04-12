import { Exception } from 'src/shared/domain/exceptions';

export class SessionException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'SessionException';
    }
}

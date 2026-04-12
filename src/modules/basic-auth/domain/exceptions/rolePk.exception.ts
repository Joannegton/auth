import { Exception } from 'src/shared/domain/exceptions';

export class RolePkException extends Exception {
    constructor(message: string) {
        super(message);
        this.name = 'RolePkException';
    }
}

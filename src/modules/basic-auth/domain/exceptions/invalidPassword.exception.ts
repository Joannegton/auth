import { BusinessException } from 'src/shared/domain/exceptions';

export class InvalidPasswordException extends BusinessException {
    constructor(message: string = 'Senha inválida') {
        super(message);
    }
}

export abstract class Exception extends Error {
    constructor(public readonly message: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, Exception.prototype);
    }
}

export class InvalidPropsException extends Exception {
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>,
    ) {
        super(message);
        Object.setPrototypeOf(this, InvalidPropsException.prototype);
    }
}

export class BusinessException extends Exception {
    constructor(
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        Object.setPrototypeOf(this, BusinessException.prototype);
    }
}

export class RepositoryNoDataFoundException extends Exception {
    constructor(
        public readonly entity: string,
        public readonly criteria?: Record<string, unknown>,
    ) {
        const message = criteria
            ? `${entity} not found matching criteria: ${JSON.stringify(criteria)}`
            : `${entity} not found`;
        super(message);
        Object.setPrototypeOf(this, RepositoryNoDataFoundException.prototype);
    }
}

export class RepositoryException extends Exception {
    constructor(
        message: string,
        public readonly originalError?: Error,
    ) {
        super(message);
        Object.setPrototypeOf(this, RepositoryException.prototype);
    }
}

export class ServiceException extends Exception {
    constructor(
        message: string,
        public readonly originalError?: Error,
    ) {
        super(message);
        Object.setPrototypeOf(this, ServiceException.prototype);
    }
}

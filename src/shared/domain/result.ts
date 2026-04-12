export class Ok<T> {
    readonly _tag = 'Ok' as const;
    constructor(readonly value: T) {}

    isOk(): this is Ok<T> {
        return true;
    }

    isErr(): this is Err<never> {
        return false;
    }
}

export class Err<E> {
    readonly _tag = 'Err' as const;
    constructor(readonly error: E) {}

    isOk(): this is Ok<never> {
        return false;
    }

    isErr(): this is Err<E> {
        return true;
    }
}

export type Result<E, T> = Ok<T> | Err<E>;

/**
 * Promise-based Result type for async operations
 * Functions returning this directly from async/await return Promise<Result<E, T>>
 */
export type ResultAsync<E, T> = Promise<Result<E, T>>;

interface ROk {
    ok(): Ok<void>;
    ok<T>(value: T): Ok<T>;
}

interface RError {
    error<E>(error: E): Err<E>;
}

interface RHelpers {
    getResult<E, T>(results: Result<E, unknown>[], value: T): Result<E, T>;
    fromPromise<E, T>(promise: Promise<T>, mapError: (e: unknown) => E): ResultAsync<E, T>;
}

function okImpl<T>(value?: T): Ok<T> {
    return new Ok(value) as any;
}

function errorImpl<E>(error: E): Err<E> {
    return new Err(error);
}

function getResultImpl<E, T>(
    results: Result<E, unknown>[],
    value: T,
): Result<E, T> {
    const firstError = results.find((r): r is Err<E> => r.isErr());
    if (firstError) return firstError as Err<E>;
    return okImpl(value) as Result<E, T>;
}

function fromPromiseImpl<E, T>(
    promise: Promise<T>,
    mapError: (e: unknown) => E,
): ResultAsync<E, T> {
    return promise
        .then((v) => okImpl(v) as Result<E, T>)
        .catch((e) => errorImpl(mapError(e)));
}

export const R = {
    ok: okImpl as ROk['ok'],
    error: errorImpl,
    getResult: getResultImpl,
    fromPromise: fromPromiseImpl,
} as ROk & RError & RHelpers;

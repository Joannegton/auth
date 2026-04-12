import { UniqueEntityID } from './unique-entity-id';

export abstract class Entity<T> {
    protected readonly _id: UniqueEntityID;
    protected readonly props: T;

    constructor(id?: string, props?: T) {
        this._id = id ? new UniqueEntityID(id) : new UniqueEntityID();
        this.props = props || ({} as T);
    }

    get id(): UniqueEntityID {
        return this._id;
    }

    public equals(object?: Entity<T>): boolean {
        if (object === null || object === undefined) {
            return false;
        }

        if (this === object) {
            return true;
        }

        if (!(object instanceof Entity)) {
            return false;
        }

        return this._id.equals(object._id);
    }
}

import { UniqueEntityID } from './unique-entity-id';
import { DomainEvent } from './domain-event';
import { CompositeId } from './value-objects/composite-id.vo';

export abstract class AggregateRoot<T> {
    protected readonly _id: UniqueEntityID | CompositeId<any>;
    protected readonly props: T;
    private _domainEvents: DomainEvent[] = [];

    protected constructor(id?: string | CompositeId<any>) {
        this.props = {} as T;
        this._id = this.createId(id);
    }

    private createId(
        id?: string | CompositeId<any>,
    ): UniqueEntityID | CompositeId<any> {
        if (id instanceof CompositeId) {
            return id;
        }

        return new UniqueEntityID(id);
    }

    public get id(): UniqueEntityID | CompositeId<any> {
        return this._id;
    }

    public get domainEvents(): DomainEvent[] {
        return [...this._domainEvents];
    }

    protected addDomainEvent(domainEvent: DomainEvent): void {
        this._domainEvents.push(domainEvent);
        console.info(
            `[Domain Event] ${domainEvent.constructor.name} added to ${this.constructor.name}`,
        );
    }

    public clearEvents(): void {
        this._domainEvents = [];
    }
}

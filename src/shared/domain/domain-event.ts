import { UniqueEntityID } from './unique-entity-id';

export interface DomainEvent {
    occurredOn: Date;
    getAggregateId(): UniqueEntityID;
}

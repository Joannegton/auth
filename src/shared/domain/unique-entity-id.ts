import { uuidv7 } from 'uuidv7';

export class UniqueEntityID {
    private readonly value: string;

    constructor(id?: string) {
        this.value = id || uuidv7();
    }

    public toString(): string {
        return this.value;
    }

    public toValue(): string {
        return this.value;
    }

    public equals(id: UniqueEntityID): boolean {
        return id.toString() === this.value;
    }
}

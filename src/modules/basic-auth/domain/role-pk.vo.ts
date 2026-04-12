import { R, Result } from 'src/shared/domain/result';
import {
    CompositeId,
    CompositeIdConfig,
} from 'src/shared/domain/value-objects/composite-id.vo';
import { RolePkException } from './exceptions/rolePk.exception';

export interface RolePkProps {
    id: string;
    idNum: number;
}

export class RolePk extends CompositeId<RolePkProps> {
    protected readonly config: CompositeIdConfig = {
        id: { type: 'uuid', required: false },
        idNum: { type: 'number', required: true },
    };

    private constructor() {
        super();
    }

    static create(idNum: number, id?: string): Result<RolePkException, RolePk> {
        const instance = new RolePk();

        const props = instance.validateAndCreateProps(id, idNum);
        if (props.isErr())
            return R.error(new RolePkException(props.error.message));

        Object.defineProperty(instance, 'props', {
            value: props.value,
            writable: false,
            configurable: false,
        });
        return R.ok(instance);
    }

    static build(id: string, idNum: number): Result<Error, RolePk> {
        return this.create(idNum, id);
    }

    get id(): string {
        return this.props.id;
    }

    get idNum(): number {
        return this.props.idNum;
    }
}

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

        const setIdResult = instance.setId(props.value.id);
        const setIdNumResult = instance.setIdNum(props.value.idNum);

        return R.getResult([setIdResult, setIdNumResult], instance);
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

    private setId(id: string): Result<RolePkException, void> {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            return R.error(
                new RolePkException(
                    `CompositeId: id deve ser string não vazia`,
                ),
            );
        }

        this.props.id = id;
        return R.ok();
    }

    private setIdNum(idNum: number): Result<RolePkException, void> {
        if (idNum <= 0 || !Number.isInteger(idNum)) {
            return R.error(
                new RolePkException(
                    `CompositeId: idNum deve ser número inteiro positivo`,
                ),
            );
        }
        this.props.idNum = idNum;
        return R.ok();
    }
}

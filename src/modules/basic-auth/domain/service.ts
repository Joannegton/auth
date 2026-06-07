import { AggregateRoot } from 'src/shared/domain/aggregate';
import { R, Result } from 'src/shared/domain/result';
import { InvalidPropsException } from 'src/shared/domain/exceptions';
import { randomBytes } from 'node:crypto';

export type CreateServiceProps = {
    name: string;
};

export type ServiceProps = {
    name: string;
    apiKey: string;
    createdAt: Date;
};

export class Service extends AggregateRoot<ServiceProps> {
    constructor(id?: string) {
        super(id);
    }

    static create(
        props: CreateServiceProps,
    ): Result<InvalidPropsException, Service> {
        const instance = new Service();

        const setNameResult = instance.setName(props.name);
        if (setNameResult.isErr()) return R.error(setNameResult.error);

        instance.setApiKey(randomBytes(32).toString('hex'));
        instance.props.createdAt = new Date();

        return R.ok(instance);
    }

    static build(
        props: ServiceProps,
        id: string,
    ): Result<InvalidPropsException, Service> {
        const instance = new Service(id);

        const setNameResult = instance.setName(props.name);
        if (setNameResult.isErr()) return R.error(setNameResult.error);

        instance.setApiKey(props.apiKey);
        instance.props.createdAt = props.createdAt;

        return R.ok(instance);
    }

    get name(): string {
        return this.props.name;
    }

    get apiKey(): string {
        return this.props.apiKey;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    private setName(name: string): Result<InvalidPropsException, void> {
        if (!name || name.trim() === '') {
            return R.error(
                new InvalidPropsException('Nome do serviço é obrigatório'),
            );
        }

        if (name.length > 100) {
            return R.error(
                new InvalidPropsException(
                    'Nome do serviço deve ter no máximo 100 caracteres',
                ),
            );
        }

        this.props.name = name.trim();
        return R.ok();
    }

    private setApiKey(apiKey: string): void {
        this.props.apiKey = apiKey;
    }

    regenerateApiKey(): void {
        this.setApiKey(randomBytes(32).toString('hex'));
    }
}

import { R, Result } from '../result';
import { ValueObject } from '../value-object';
import { uuidv7 } from 'uuidv7';

/**
 * CompositeId: Value Object abstrato para PKs compostas
 *
 * Permite criar Value Objects com múltiplas chaves de diferentes tipos:
 * - string: Auto-gera uuid7 se não fornecido
 * - number: Obrigatório (não auto-gera)
 * - boolean, date, etc: Suporta qualquer tipo
 *
 * Padrão DDD:
 * - Estende ValueObject
 * - Validação automática por tipo
 * - Imutável (props congelado)
 * - Reutilizável para qualquer PK composta
 *
 * @example
 * // RolePk com 2 chaves
 * export class RolePk extends CompositeId<{ id: string; idNum: number }> {
 *   static create(id?: string, idNum: number): RolePk { ... }
 * }
 *
 * // UserOrgId com 3 chaves
 * export class UserOrgId extends CompositeId<{ userId: string; orgId: string; roleId: number }> {
 *   static create(userId?: string, orgId?: string, roleId: number): UserOrgId { ... }
 * }
 */
export interface CompositeIdConfig {
    [key: string]: {
        type: 'string' | 'number' | 'uuid' | 'date' | 'boolean';
        required: boolean;
    };
}

export abstract class CompositeId<
    T extends Record<string, any>,
> extends ValueObject<T> {
    /**
     * Configuração abstrata das chaves
     * Subclasses devem implementar para descrever sua estrutura
     *
     * @example
     * protected readonly config: CompositeIdConfig = {
     *   id: { type: 'uuid', required: false },
     *   idNum: { type: 'number', required: true },
     * };
     */
    protected abstract readonly config: CompositeIdConfig;

    /**
     * Construtor protegido
     * Sempre use factory methods (create/build) nas subclasses
     */
    protected constructor() {
        super();
    }

    /**
     * Validar e criar props a partir de valores fornecidos
     * Chamado pelos factory methods das subclasses
     *
     * @param values Array de valores na ordem da config
     * @returns Props validado e congelado
     *
     * @throws Error se validação falhar
     *
     * @example
     * const props = this.validateAndCreateProps(undefined, 1);
     * // Se id é uuid + required=false → gera uuid7
     * // Se idNum é number + required=true → valida e usa
     */
    protected validateAndCreateProps(...values: any[]): Result<Error, T> {
        const keys = Object.keys(this.config);

        if (values.length !== keys.length) {
            throw new Error(
                `CompositeId: esperado ${keys.length} valores, recebido ${values.length}`,
            );
        }

        const props: any = {};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];
            const keyConfig = this.config[key];

            props[key] = this.validateField(key, value, keyConfig);
        }

        return R.ok(Object.freeze(props) as T) as Result<Error, T>;
    }

    /**
     * Validar campo individual
     * Lógica por tipo
     */
    private validateField(
        key: string,
        value: any,
        config: { type: string; required: boolean },
    ): any {
        switch (config.type) {
            case 'uuid':
                return this.validateUuid(key, value, config.required);

            case 'string':
                return this.validateString(key, value, config.required);

            case 'number':
                return this.validateNumber(key, value, config.required);

            case 'date':
                return this.validateDate(key, value, config.required);

            case 'boolean':
                return this.validateBoolean(key, value, config.required);

            default:
                throw new Error(
                    `CompositeId: tipo desconhecido: ${config.type}`,
                );
        }
    }

    /**
     * Validação: UUID
     * - Se não fornecido e não required: gera uuid7
     * - Se fornecido: valida formato
     */
    private validateUuid(key: string, value: any, required: boolean): string {
        // Auto-gerar uuid7 se vazio e não required
        if (!value && !required) {
            return uuidv7();
        }

        // Obrigatório e não fornecido
        if (!value && required) {
            throw new Error(`CompositeId: ${key} (UUID) é obrigatório`);
        }

        // Validar formato UUID (básico)
        if (typeof value !== 'string') {
            throw new Error(`CompositeId: ${key} deve ser string`);
        }

        if (!this.isValidUuid(value)) {
            throw new Error(`CompositeId: ${key} não é UUID válido`);
        }

        return value;
    }

    /**
     * Validação: String
     * - Se não fornecido e não required: retorna vazio
     * - Se fornecido: valida não-vazio
     */
    private validateString(key: string, value: any, required: boolean): string {
        if (!value && !required) {
            return '';
        }

        if (!value && required) {
            throw new Error(`CompositeId: ${key} (string) é obrigatório`);
        }

        if (typeof value !== 'string') {
            throw new Error(`CompositeId: ${key} deve ser string`);
        }

        if (value.trim() === '') {
            throw new Error(`CompositeId: ${key} não pode ser vazio`);
        }

        return value;
    }

    /**
     * Validação: Number
     * - SEMPRE obrigatório (sem auto-gera)
     * - Deve ser inteiro e positivo
     */
    private validateNumber(key: string, value: any, required: boolean): number {
        if (!Number.isInteger(value) || value <= 0) {
            throw new Error(
                `CompositeId: ${key} deve ser número inteiro positivo`,
            );
        }

        return value;
    }

    /**
     * Validação: Date
     * - Se não fornecido e não required: retorna undefined
     * - Se fornecido: valida que é Date
     */
    private validateDate(
        key: string,
        value: any,
        required: boolean,
    ): Date | undefined {
        if (!value && !required) {
            return undefined;
        }

        if (!value && required) {
            throw new Error(`CompositeId: ${key} (Date) é obrigatório`);
        }

        if (!(value instanceof Date)) {
            throw new Error(`CompositeId: ${key} deve ser uma Date`);
        }

        return value;
    }

    /**
     * Validação: Boolean
     * - Se não fornecido e não required: retorna false
     * - Se fornecido: valida que é boolean
     */
    private validateBoolean(
        key: string,
        value: any,
        required: boolean,
    ): boolean {
        if (typeof value === 'undefined' && !required) {
            return false;
        }

        if (typeof value === 'undefined' && required) {
            throw new Error(`CompositeId: ${key} (boolean) é obrigatório`);
        }

        if (typeof value !== 'boolean') {
            throw new Error(`CompositeId: ${key} deve ser boolean`);
        }

        return value;
    }

    /**
     * Validar se string é UUID válido (regex básico)
     */
    private isValidUuid(uuid: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    get ids(): T {
        return this.props;
    }
}

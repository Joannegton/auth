export abstract class Model<T> {
    // Tornamos as props acessíveis para as subclasses, mas mantemos o contrato
    protected readonly props: T;

    constructor(props?: T) {
        this.props = props || ({} as T);
    }

    /**
     * TModel: A classe que está sendo instanciada (ex: RoleModel)
     * TProps: A interface de propriedades (ex: RoleProps)
     */
    static build<TModel extends Model<any>>(
        this: new (props?: any) => TModel,
        // Aqui garantimos que 'props' deve seguir exatamente a interface T do Model
        props: TModel extends Model<infer TProps> ? TProps : any,
    ): TModel {
        const instance = new this(props);

        // Mapeia os valores das props para as propriedades da classe (colunas do TypeORM)
        Object.assign(instance, props);

        return instance;
    }
}

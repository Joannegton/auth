import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adiciona `name` e `phone` à tabela de usuários.
 *
 * Ambas as colunas são NULLABLE de propósito: o serviço de autenticação é
 * compartilhado por vários produtos e nem todos exigem esses dados. Cada
 * produto que precisar (ex.: Beleze) valida a obrigatoriedade na sua própria
 * camada de registro. Usuários antigos permanecem com NULL (sem backfill).
 */
export class AddUserNamePhone1748202000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('users', [
            new TableColumn({
                name: 'name',
                type: 'varchar',
                length: '120',
                isNullable: true,
            }),
            new TableColumn({
                name: 'phone',
                type: 'varchar',
                length: '20',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'phone');
        await queryRunner.dropColumn('users', 'name');
    }
}

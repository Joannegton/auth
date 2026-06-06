# ⚠️ Gap: Bootstrap do primeiro OWNER

> Status: **aberto** · Prioridade: **alta** · Tipo: segurança / operação

## Problema

Não existe forma suportada de criar o **primeiro usuário `OWNER`** de um ambiente novo.
É um clássico ovo-e-galinha:

- O registro público (`POST /auth/register`) **só permite criar `CLIENT`** quando não há
  usuário autenticado — ver `UserRoleAssignmentPolicy.validateCreatorPermission()`
  (`src/modules/basic-auth/domain/policies/user-role-assignment.policy.ts`).
- Para criar um `OWNER` é preciso **já ser `OWNER`** (mesma policy + `RoleGuard`).
- As migrations semeiam apenas **roles** (`owner=1 … client=7`) e o serviço `auth-service`
  (`SeedDefaultRoles`, `SeedAuthService`). **Nenhum usuário é criado.**

Resultado: num deploy novo o sistema sobe com `users = 0` e **ninguém consegue
administrar nada** sem intervenção manual no banco.

## Workaround atual (manual, não versionado)

1. Registrar um usuário comum (vira `CLIENT`, senha hasheada pela app):
   ```
   POST auth-app:3001/auth/register
   { "email": "...", "password": "...", "serviceId": "<auth-service id>" }
   ```
2. Promover direto no banco:
   ```sql
   UPDATE user_roles ur
   SET role_id_num = 1, role_id = (SELECT id FROM roles WHERE id_num = 1)
   FROM users u
   WHERE ur.user_id = u.id AND u.email = '...';
   ```

Problemas do workaround: exige acesso ao Postgres, é fácil de errar (PK composta
`role_id` + `role_id_num`), não é auditável e não é reprodutível em CI/CD.

## Impacto

- **Bloqueia** qualquer ambiente novo (dev, staging, prod) até alguém mexer no banco.
- Risco de segurança: a tentação é afrouxar a policy de registro, o que abriria
  escalonamento de privilégio para qualquer um.
- Sem trilha de auditoria de quem virou OWNER e quando.

## Ideias de solução (a discutir)

### 1. Seed idempotente via env (mais simples) — **recomendado p/ urgência**
Uma migration/seed `SeedInitialOwner` que, **se `users = 0`**, cria um OWNER a partir de
variáveis de ambiente:
```
INITIAL_OWNER_EMAIL=...
INITIAL_OWNER_PASSWORD=...   # hasheada com o mesmo PasswordEncryptionService da app
INITIAL_OWNER_SERVICE_ID=... # default: auth-service
```
- ✅ Reprodutível, roda no boot, zero acesso manual ao banco.
- ✅ Idempotente (só age se não houver owner).
- ⚠️ Senha em env — mitigar com secret manager e/ou forçar troca no 1º login.

### 2. Comando CLI dedicado (`npm run owner:create`)
Script Nest standalone que reusa o `CreateUserUseCase` + promoção, com prompts/flags.
- ✅ Não roda automático (controle do operador), reusa hashing/validações da app.
- ⚠️ Exige acesso ao container/host para rodar.

### 3. Endpoint de setup protegido por token de uso único
`POST /auth/bootstrap-owner` que só funciona enquanto `users = 0` **e** exige um
`SETUP_TOKEN` do ambiente; depois do primeiro owner, passa a responder 410/404.
- ✅ Sem tocar no banco, auditável.
- ⚠️ Superfície de ataque nova; precisa de testes e expirar de forma robusta.

### 4. Flag na policy + criação assistida
Permitir o 1º OWNER apenas quando não existe nenhum, dentro da própria policy.
- ⚠️ Mistura regra de bootstrap com regra de negócio; mais fácil de introduzir bug.

## Recomendação

Implementar **(1) seed idempotente via env** para destravar já, e avaliar **(2) CLI**
como ferramenta operacional de longo prazo. Em qualquer opção:
- Reutilizar o `PasswordEncryptionService` (não gerar hash na mão).
- Respeitar a PK composta de `user_roles` (`role_id` + `role_id_num`).
- Logar/auditar a criação do owner.

## Referências no código

- `src/modules/basic-auth/domain/policies/user-role-assignment.policy.ts` — regra que bloqueia.
- `src/modules/basic-auth/application/usecases/create-user.usecase.ts` — fluxo de criação + hashing.
- `src/shared/infra/guards/role.guard.ts` — `OWNER` passa em qualquer `RequireRoles`.
- `src/shared/infra/migrations/1712282850000-SeedAuthService.ts` — cria o `auth-service`.
- `src/shared/infra/migrations/1712283000000-UpdateRolesToIncludeOwner.ts` — semeia a role OWNER.

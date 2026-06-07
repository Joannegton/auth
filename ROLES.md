# Roles do Auth Service

O auth é um serviço de autenticação **genérico e multi-tenant**. Qualquer aplicação pode se conectar a ele usando um `serviceId` (UUID fixo por serviço). Roles, usuários e sessões são sempre escopados por `serviceId` — um usuário do Beleze não interfere com usuários de outro serviço, mesmo que compartilhem o mesmo e-mail.

---

## Hierarquia de Roles

**Regra geral: menor `idNum` = maior privilégio.**

| idNum | name | Descrição |
|-------|------|-----------|
| 1 | `owner` | Proprietário da plataforma. Criado internamente. Acesso irrestrito a qualquer `serviceId`. Único que pode criar outros owners. |
| 2 | `admin` | Administrador de um serviço. Gerencia workers, conteúdo e clientes dentro do seu `serviceId`. Ex: dono de salão no Beleze. |
| 3 | `moderator` | Supervisor do serviço. Pode criar e gerenciar workers, guests e clients dentro do `serviceId`. Ex: gerente de salão. |
| 4 | `worker` | Colaborador operacional. Executa tarefas do serviço sem poder gerenciar outros usuários. Ex: profissional de salão no Beleze. |
| 5 | `guest` | Acesso limitado de leitura. Não pode criar outros usuários. Uso opcional por serviços que precisam de acesso temporário ou de demonstração. |
| 6 | `banned` | Acesso revogado. Token ainda pode estar ativo até expirar, mas guards que checam esta role devem rejeitar a requisição. |
| 7 | `client` | Usuário final do serviço. Criado via registro público sem autenticação. Ex: cliente que agenda pelo Beleze. |

```
Hierarquia visual:

  OWNER (1)        ← único acesso cross-serviceId
    └── ADMIN (2)      ← admin dentro do serviceId
          └── MODERATOR (3)
                └── WORKER (4)
                      └── GUEST (5)
                            └── BANNED (6)
                                  └── CLIENT (7)  ← registro público
```

---

## Política de Atribuição de Roles

Quem pode criar quem (sempre dentro do mesmo `serviceId`, exceto OWNER):

| Criador | Pode atribuir |
|---------|--------------|
| `owner` (1) | qualquer role, em qualquer serviceId |
| `admin` (2) | moderator, worker, guest, banned, client — **somente no seu serviceId** |
| `moderator` (3) | worker, guest, banned, client — **somente no seu serviceId** |
| `worker` (4) | nenhuma |
| `guest` (5) | nenhuma |
| `banned` (6) | nenhuma |
| `client` (7) | nenhuma |
| sem autenticação | client apenas |

**Referência:** `src/modules/basic-auth/domain/policies/user-role-assignment.policy.ts`

---

## ⚠️ Escopo por serviceId — "ADMIN do Beleze ≠ admin do auth"

Esta é a confusão mais comum ao integrar novos serviços.

Quando um dono de salão no Beleze recebe a role `admin` (idNum=2), isso **não** significa que ele é administrador do serviço de auth em si. O isolamento acontece em duas camadas:

1. **JWT**: o token carrega `serviceId: "<beleze-uuid>"` — ele identifica a qual serviço aquele token pertence.
2. **Policy**: ao criar um usuário, a `UserRoleAssignmentPolicy` verifica se o criador tem role no `serviceId` informado no corpo da requisição. Se os `serviceId`s não coincidem → `ForbiddenException`.

### O que um ADMIN do Beleze pode fazer diretamente no auth:

| Ação | Resultado |
|------|-----------|
| `POST /auth/workers` com `serviceId=<beleze-id>` | ✅ Cria worker/moderator/client no Beleze |
| `POST /auth/workers` com `serviceId=<outro-id>` | ❌ Bloqueado — "Creator não tem role no serviço X" |
| `POST /auth/workers` com `roleIdNum=2` (ADMIN) | ❌ Bloqueado — "ADMIN só pode criar roles menores que ADMIN" |
| `POST /auth/workers` com `roleIdNum=1` (OWNER) | ❌ Bloqueado — "Apenas OWNER pode criar usuários com role OWNER" |
| `POST /auth/logout` | ✅ Logout de si mesmo |

---

## JWT Payload

```json
{
  "sub": "019abc12-...",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "phone": "11999999999",
  "serviceId": "019dccab-f4a7-763d-8d4d-2a14f361cf7f",
  "roles": [2],
  "iat": 1749300000,
  "exp": 1749300900
}
```

- `sub` — UUID do usuário
- `serviceId` — identifica o serviço; todas as validações de escopo usam este campo
- `roles` — array de `idNum`; um usuário pode ter múltiplas roles no mesmo serviço
- Algoritmo: **RS256** (par de chaves RSA — a chave pública é exposta em `GET /auth/public-key`)

---

## Endpoints do Auth e Quem Pode Acessar

| Endpoint | Guard | Quem acessa |
|----------|-------|-------------|
| `POST /auth/register` | `OptionalJwtAuthGuard` | Qualquer um; com token pode criar roles maiores |
| `POST /auth/login` | `ThrottlerGuard` | Qualquer um |
| `POST /auth/refresh` | nenhum | Qualquer um com refresh token válido |
| `POST /auth/logout` | `JwtAuthGuard` | Usuário autenticado (logout próprio) |
| `POST /auth/workers` | `JwtAuthGuard` | Autenticado com permissão de criação (ADMIN+) |
| `POST /auth/forgot-password` | `ThrottlerGuard` | Qualquer um |
| `POST /auth/reset-password` | `ThrottlerGuard` | Qualquer um com código válido |
| `GET /auth/public-key` | nenhum | Qualquer serviço (para validar JWTs) |

> O auth **não usa `RoleGuard` nos seus próprios endpoints** — o controle de acesso é feito dentro dos use cases via `UserRoleAssignmentPolicy`.

---

## Fluxo de Cada Serviço Conectado

### Beleze (agendamento de salões)

Beleze usa um **proxy HTTP**: todas as chamadas de autenticação passam pelo `beleze_server`, que encaminha ao auth com o `serviceId` correto.

| Ação no Beleze | roleIdNum | Endpoint no auth | Quem autoriza |
|----------------|-----------|-----------------|--------------|
| Cliente se registra | 7 (client) | `POST /auth/register` | sem auth (registro público) |
| Cliente faz login | — | `POST /auth/login` | — |
| Dono de salão é criado | 2 (admin) | `POST /auth/workers` | token do platform OWNER |
| Profissional é cadastrado | 4 (worker) | `POST /auth/workers` | token do ADMIN (dono do salão) |

**Env vars necessárias no Beleze:**
- `AUTH_SERVICE_URL` — URL base do auth
- `BELEZE_SERVICE_ID` — UUID fixo do serviço Beleze no auth
- `ROLE_ID_CLIENT` — `7` (idNum do client)

### Portifolio (Next.js)

Portifolio **não chama o auth diretamente**. Ele valida tokens usando a chave pública RSA, configurada via variável de ambiente `AUTH_PUBLIC_KEY`. Não há proxy — o token emitido pelo auth é verificado localmente.

---

## Como Integrar um Novo Serviço

1. **Definir um `serviceId` fixo** — gere um UUID v7 e registre-o no env do novo serviço. Ele será o identificador permanente do serviço no auth.

2. **Criar o primeiro ADMIN do serviço** — usando um token de OWNER da plataforma, chame:
   ```http
   POST /auth/workers
   Authorization: Bearer <owner-token>
   
   {
     "email": "admin@meuservico.com",
     "password": "senha-segura",
     "roleIdNum": 2,
     "serviceId": "<meu-service-id>"
   }
   ```

3. **Registrar clientes** — chame `POST /auth/register` com `serviceId` e `roleIdNum: 7` (ou omita, pois CLIENT é o padrão).

4. **Validar tokens** — duas opções:
   - **Proxy HTTP** (como o Beleze): chamar `GET /auth/public-key`, cachear e validar com RS256
   - **Chave estática no env** (como o Portifolio): copiar a chave pública para `AUTH_PUBLIC_KEY`

5. **Proteger rotas** — implementar um guard que lê `payload.roles` e `payload.serviceId` do JWT; rejeitar se `serviceId` não for o do seu serviço.

---

## Referências de Código

| Arquivo | Conteúdo |
|---------|---------|
| `src/modules/basic-auth/domain/constants/roles.constants.ts` | Enum `ROLES`, `ROLE_NAMES`, `ROLE_DESCRIPTIONS` |
| `src/modules/basic-auth/domain/policies/user-role-assignment.policy.ts` | Regras de quem pode criar quem |
| `src/modules/basic-auth/domain/user-role.ts` | Entidade UserRole (userId + roleId + serviceId) |
| `src/modules/basic-auth/infra/services/token-generator.service.ts` | Geração de JWT RS256 com roles[] |
| `src/modules/basic-auth/application/usecases/create-user.usecase.ts` | Registro público |
| `src/modules/basic-auth/application/usecases/create-worker.usecase.ts` | Criação autenticada de usuários |
| `src/shared/infra/guards/role.guard.ts` | Decorator `@RequireRoles` e guard |

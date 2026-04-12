# RoleGuard - Setup e Configuração

## O que foi feito

Criei uma estrutura completa de guards para verificar roles de usuários:

### 1. **Arquivo de Constantes** (`roles.constants.ts`)
- `enum ROLES` - Define os papéis do sistema (ADMIN, MODERATOR, USER, GUEST, BANNED)
- `type RoleId` - Tipo para usar nos guards
- `ROLE_NAMES` - Mapeamento de RoleId para nomes legíveis
- `ROLE_DESCRIPTIONS` - Descrições de cada role

### 2. **RoleGuard** (`role.guard.example.ts`)
- Guard que verifica se o usuário tem as roles necessárias
- Decorador `@RequireRoles()` para especificar roles requeridas
- Decorador `@UseRoleGuard()` para combinar ambos de forma concisa

### 3. **Erro resolvido**
- ❌ `Cannot find name 'RoleId'` → ✅ Definido em `roles.constants.ts`
- ❌ `SYSTEM_ROLES não existe` → ✅ Agora é `ROLES`
- ❌ `ROLE_NAMES não existia` → ✅ Criado com mapeamento de IDs

---

## Setup no seu projeto

### Passo 1: Registrar o Guard no módulo

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from 'src/shared/infra/guards';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
```

**OU** use localmente por controller:

```typescript
import { UseGuards } from '@nestjs/common';
import { RoleGuard } from 'src/shared/infra/guards';

@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {}
```

### Passo 2: Importar constantes nos controllers

```typescript
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';
```

### Passo 3: Usar nos endpoints

```typescript
import { Post } from '@nestjs/common';
import { UseRoleGuard } from 'src/shared/infra/guards';
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';

@Post('delete-user')
@UseRoleGuard(ROLES.ADMIN)
async deleteUser() { }
```

---

## Estrutura esperada

O usuário extraído do JWT deve ter esta estrutura:

```typescript
interface UserFromJWT {
    id: string;
    email: string;
    roles: ROLES[];  // Array de números: [1, 2, 3]
}
```

### Exemplo de JWT com roles:

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "roles": [1, 2],
  "iat": 1234567890
}
```

---

## Fluxo completo

```
1. Usuário autenticado faz request com JWT
   ↓
2. Extrai o usuário do token
   ↓
3. Guard intercepta a requisição
   ↓
4. Verifica roles no decorator @RequireRoles()
   ↓
5. Compara com as roles do usuário
   ↓
6. Acesso concedido ✅ ou 403 Forbidden ❌
```

---

## Exemplo de erro

Se usuário não tiver role necessária:

**Request:**
```bash
POST /admin/users/1/delete
Authorization: Bearer <token-user-comum>
```

**Response (403):**
```json
{
  "error": {
    "message": "Roles necessárias: Administrador",
    "statusCode": 403
  }
}
```

---

## Próximos passos

1. **Estratégia JWT**: Configure seu `JwtStrategy` para extrair roles do token
2. **Seed de roles**: A migration `SeedDefaultRoles.ts` já cria as roles padrão
3. **Associar roles aos usuários**: Use a tabela `user_roles` para vincular usuários a roles

---

## Arquivo de exemplo

Para ver um exemplo completo de uso, veja `EXEMPLO_USO.md`

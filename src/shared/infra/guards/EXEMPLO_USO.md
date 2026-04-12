# RoleGuard - Exemplo de Uso

## 1. Importar as constantes de roles

```typescript
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';
```

## 2. Usar no Controller

### Opção A: Com `@UseGuards + @RequireRoles`

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { RoleGuard, RequireRoles } from 'src/shared/infra/guards';
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';

@Controller('users')
export class UsersController {
    @Post('delete')
    @UseGuards(RoleGuard)
    @RequireRoles(ROLES.ADMIN)
    async deleteUser() {
        // Apenas admin pode acessar
    }

    @Post('approve')
    @UseGuards(RoleGuard)
    @RequireRoles(ROLES.ADMIN, ROLES.MODERATOR)
    async approveContent() {
        // Admin ou Moderator podem acessar
    }
}
```

### Opção B: Com `@UseRoleGuard` (Mais conciso)

```typescript
import { Controller, Post } from '@nestjs/common';
import { UseRoleGuard } from 'src/shared/infra/guards';
import { ROLES } from 'src/modules/basic-auth/domain/constants/roles.constants';

@Controller('users')
export class UsersController {
    @Post('delete')
    @UseRoleGuard(ROLES.ADMIN)
    async deleteUser() {
        // Apenas admin pode acessar
    }

    @Post('approve')
    @UseRoleGuard(ROLES.ADMIN, ROLES.MODERATOR)
    async approveContent() {
        // Admin ou Moderator podem acessar
    }
}
```

## 3. Como o Guard funciona

1. Obtém as roles requeridas do decorator `@RequireRoles`
2. Verifica se o usuário está autenticado (req.user)
3. Compara as roles do usuário com as roles requeridas
4. Se não tiver role necessária, lança `ForbiddenException`

## 4. Estrutura esperada do usuário (JWT/Token)

O usuário no request deve ter a seguinte estrutura:

```typescript
{
    id: string;
    email: string;
    roles: ROLES[];  // Array com os ROLES do usuário
}
```

## 5. Roles disponíveis

```typescript
enum ROLES {
    ADMIN = 1,       // Administrador - Acesso total
    MODERATOR = 2,   // Moderador - Pode gerenciar conteúdo e usuários
    USER = 3,        // Usuário padrão - Acesso completo
    GUEST = 4,       // Convidado - Acesso limitado
    BANNED = 5,      // Banido - Sem acesso
}
```

## 6. Exemplo completo com User extraído do token

```typescript
@Controller('admin')
export class AdminController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {}

    @Post('ban-user')
    @UseRoleGuard(ROLES.ADMIN)
    async banUser(
        @Body() dto: { userId: string },
        @Request() req: any,
    ) {
        const adminId = req.user.id;
        
        this.logger.debug(`Admin ${adminId} está banindo usuário ${dto.userId}`);
        
        const result = await this.userService.banUser(dto.userId);
        
        return result; // AppResponse
    }

    @Post('promote-moderator')
    @UseRoleGuard(ROLES.ADMIN)
    async promoteModerator(
        @Body() dto: { userId: string },
    ) {
        const result = await this.userService.promoteToModerator(dto.userId);
        return result;
    }
}
```

## 7. Tratamento de erros

Se um usuário tentar acessar um endpoint sem a role necessária:

**Request:**
```bash
POST /admin/delete-content HTTP/1.1
Authorization: Bearer <token-user>
```

**Response (403 Forbidden):**
```json
{
    "error": {
        "message": "Roles necessárias: Administrador, Moderador",
        "statusCode": 403
    }
}
```

## 8. Verificar se usuário está autenticado mas sem role específica

```typescript
@Post('public-but-protected')
@UseGuards(JwtAuthGuard)  // Apenas autenticado
async publicEndpoint() {
    // Qualquer usuário autenticado pode acessar
}

@Post('admin-only')
@UseRoleGuard(ROLES.ADMIN)  // Autenticado + com role ADMIN
async adminEndpoint() {
    // Apenas ADMIN pode acessar
}
```

# AppResponse - Setup

## Descrição

O `AppResponse` é uma classe abstrata para padronizar todas as respostas HTTP da sua API.

### Formato de Resposta

**Sucesso:**
```json
{
  "data": {
    "id": "123",
    "name": "João"
  }
}
```

**Erro:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "statusCode": 400
  }
}
```

---

## Como Usar

### Opção 1: Manual nos Controllers (Recomendado para mais controle)

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AppResponse } from 'src/shared/infra/http/app-response';

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    try {
      const user = { id: '123', name: 'João' };
      return AppResponse.ok(user);
    } catch (error) {
      return AppResponse.internalServerError('Erro ao criar usuário');
    }
  }

  @Post('validate')
  validate(@Body() dto: CreateUserDto) {
    if (!dto.email) {
      return AppResponse.badRequest('Email é obrigatório', 'MISSING_EMAIL');
    }
    return AppResponse.ok({ valid: true });
  }
}
```

### Opção 2: Com Interceptor (Recomendado para praticidade)

Registre o interceptor no `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppResponseInterceptor } from 'src/shared/infra/http/app-response.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AppResponseInterceptor,
    },
  ],
})
export class AppModule {}
```

Com o interceptor registrado, seus controllers podem retornar dados normalmente:

```typescript
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // Retorna um objeto normal
    const user = { id: '123', name: 'João' };
    return user;
    // O interceptor automaticamente converte para: { data: user }
  }

  @Post('validate')
  validate(@Body() dto: CreateUserDto) {
    // Pode retornar AppResponse.error() manualmente quando necessário
    if (!dto.email) {
      return AppResponse.badRequest('Email é obrigatório');
    }
    return { valid: true }; // Será convertido para { data: { valid: true } }
  }
}
```

---

## Métodos Disponíveis

```typescript
// Sucesso
AppResponse.ok(data)

// Erro genérico
AppResponse.error(message, statusCode, code?)

// Erro 400 - Requisição inválida
AppResponse.badRequest(message, code?)

// Erro 401 - Não autorizado
AppResponse.unauthorized(message?, code?)

// Erro 403 - Proibido
AppResponse.forbidden(message?, code?)

// Erro 404 - Não encontrado
AppResponse.notFound(message?, code?)

// Erro 409 - Conflito
AppResponse.conflict(message, code?)

// Erro 500 - Erro interno
AppResponse.internalServerError(message?, code?)

// Verificações
AppResponse.isSuccess(response)  // boolean
AppResponse.isError(response)    // boolean
```

---

## Integração com Exception Filter

O `GlobalExceptionFilter` já retorna um formato de erro. Para manter consistência,
o interceptor automaticamente reconhece respostas já formatadas e as retorna como estão.

Se quiser adicionar mais contexto ao erro do exception filter, você pode fazer:

```typescript
response.status(statusCode).json(
  AppResponse.error(message, statusCode, code)
);
```

---

## Exemplo Completo

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AppResponse } from 'src/shared/infra/http/app-response';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    // Validação
    if (!dto.email.includes('@')) {
      return AppResponse.badRequest('Email inválido', 'INVALID_EMAIL');
    }

    try {
      // Lógica de criação
      const user = await this.authService.register(dto);
      return AppResponse.ok(user);
    } catch (error) {
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        return AppResponse.conflict('Email já cadastrado', 'EMAIL_ALREADY_EXISTS');
      }
      return AppResponse.internalServerError('Erro ao registrar');
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);

    if (!result.token) {
      return AppResponse.unauthorized('Credenciais inválidas');
    }

    return AppResponse.ok(result);
  }
}
```

---

## Notas

- Sempre use status codes HTTP apropriados com `@HttpCode()` decorador
- O `code` é opcional e útil para tratamento específico no frontend
- O interceptor preserva qualquer coisa que já esteja formatada com AppResponse
- Para máximo controle, use AppResponse manualmente em cada método

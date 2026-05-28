# 🛡️ Auth-Hub: Microsserviço de Autenticação e Autorização

> **Identity Provider (IdP)** central para o ecossistema de aplicações, com foco em segurança, escalabilidade e DDD.

> ## ⚠️ PENDÊNCIA — E-MAIL DO RESET DE SENHA NÃO É REAL
>
> O fluxo de **reset de senha por código (OTP)** (`POST /auth/forgot-password` e `POST /auth/reset-password`) está implementado, **mas o envio de e-mail é um stub de desenvolvimento**: `LogEmailService` apenas **registra o código no log do servidor** — ele **não chega ao usuário**.
>
> **Antes de produção:** implementar um adaptador real de `IEmailService` (SMTP / SendGrid / SES) e registrá-lo no lugar do `LogEmailService` em `basic-auth.module.ts`. Sem isso, ninguém consegue redefinir a senha de fato.
>
> Operacional: rodar a migration `1748300000000-CreatePasswordResetCodes` (tabela `password_reset_codes`).

## 📊 Status do Projeto

| Aspecto                         | Status  | Observações                                                               |
| ------------------------------- | ------- | ------------------------------------------------------------------------- |
| **Estrutura Base**              | ✅ 100% | DDD + Clean Architecture implementados                                    |
| **Autenticação Local**          | ✅ 100% | Email/senha com bcrypt (10 rounds) + Audit Log                            |
| **OAuth2 (Google)**             | ✅ 100% | Autenticação + criação automática de usuário + role assignment            |
| **JWT / RS256**                 | ✅ 100% | Tokens assimétricos com chaves RSA-2048                                   |
| **RBAC**                        | ✅ 100% | Guards e decorators @RequireRoles implementados                           |
| **Refresh Tokens**              | ✅ 100% | Geração + armazenamento seguro em DB com revogação imediata               |
| **Rate Limiting**               | ✅ 100% | Implementado em /login, /register, /google                                |
| **Session Revocation (Logout)** | ✅ 100% | POST /auth/logout com revogação de todas as sessões                       |
| **Reset de senha (OTP)**        | ⚠️ Parcial | Fluxo forgot/reset pronto; **e-mail é stub (`LogEmailService` só loga)** — configurar provedor real em produção |
| **Helmet**                      | ✅ 100% | Headers de segurança configurados                                         |
| **CORS**                        | ✅ 100% | Whitelist de domínios configurada                                         |
| **Fingerprinting**              | ✅ 100% | User-Agent + IP validation implementado                                   |
| **Audit Logging**               | ✅ 100% | Log de eventos críticos em todos os use cases                             |
| **Unit Tests**                  | ✅ 100% | 11 testes passando (LoginUseCase + RefreshTokenUseCase com DB validation) |
| **Magic Link**                  | ❌ 0%   | Planejado para v2                                                         |
| **2FA**                         | ❌ 0%   | Planejado para v2                                                         |
| **Documentação**                | ✅ 100% | Completa e atualizada                                                     |

---

### ⚠️ Melhorias Futuras (Roadmap v2.0)

- Magic Link authentication (passwordless)
- Two-Factor Authentication (2FA)
- Device management (listar/revogar dispositivos)
- PKCE para mobile (OAuth2 enhancement)
- Geolocation detection (alertar se login de país diferente)
- Integration com serviços de logging externo (DataDog, CloudWatch)

---

## 🚀 Endpoints Disponíveis

```bash
# Login com email/senha
POST /auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
# Response: { accessToken, refreshToken, expiresIn }

# Renovar access token (validado contra BD + JWT)
POST /auth/refresh
Content-Type: application/json
{ "refreshToken": "..." }
# Response: { accessToken, refreshToken, expiresIn }

# Logout (revoga TODAS as sessões do usuário)
POST /auth/logout
Authorization: Bearer <accessToken>
# Response: { ok: true }

# Registrar novo usuário
POST /auth/register
Content-Type: application/json
{
  "email": "newuser@example.com",
  "password": "password123",
  "roleIdNum": 3  # USUARIO = 3
}

# Obter chave pública (para validar tokens)
GET /auth/public-key
# Response: { publicKey: "-----BEGIN PUBLIC KEY-----..." }

# Iniciar fluxo Google OAuth
GET /auth/google
# Redireciona para Google (rate limited)

# Callback do Google OAuth
# Se usuário existe → login
# Se email existe → atualiza googleId + login
# Se novo usuário → CRIA com role USUARIO(3) + login
GET /auth/google/callback
# Redireciona com tokens para CLIENT_REDIRECT_URL
```

---

### 📅 Features Futuras (v2.0)

- [ ] Magic Link authentication
- [ ] Two-Factor Authentication (2FA)
- [ ] Passwordless authentication
- [ ] PKCE para mobile
- [ ] Device management
- [ ] Account recovery
- [ ] Notification service integration

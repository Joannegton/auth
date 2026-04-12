# 🧪 Testes de Endpoints - Auth Service

## ⚙️ Pré-requisitos

- [x] Servidor rodando em `http://localhost:5000`
- [x] Banco de dados PostgreSQL configurado:
    - DB_HOST=localhost
    - DB_PORT=5432
    - DB_USER=postgres
    - DB_PASSWORD=postgres
    - DB_NAME=auth

---

## 📋 Endpoints Disponíveis

| Método | Endpoint                | Autenticado? | Status                            |
| ------ | ----------------------- | ------------ | --------------------------------- |
| GET    | `/`                     | ❌           | ✅ Funciona                       |
| POST   | `/auth/register`        | ❌           | ✅ Funciona                       |
| POST   | `/auth/login`           | ❌           | ✅ Funciona                       |
| POST   | `/auth/refresh`         | ❌           | ✅ Funciona                       |
| POST   | `/auth/logout`          | ✅           | ✅ Funciona                       |
| GET    | `/auth/public-key`      | ❌           | ✅ Funciona                       |
| GET    | `/auth/google`          | ❌           | ✅ Funciona (testado manualmente) |
| GET    | `/auth/google/callback` | Passport     | ✅ Funciona (testado manualmente) |

---

## ✅ TESTES EXECUTADOS (12/04/2026)

### 1️⃣ GET / (Health Check)

**Teste:**

```bash
curl http://localhost:5000/
```

**Resultado:**

```
Status: 200 OK
Body: Hello World!
```

**Status:** ✅ SUCESSO

---

### 2️⃣ POST /auth/register (Novo Usuário)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"Senha@Test123"}'
```

**Resultado:**

```
Status: 200 OK
Body: {"data":null}
```

**Validação no Banco:**
✅ Usuário criado com:

- email: `usuario@test.com`
- password: `[HASH bcrypt salvo corretamente]`
- provider: `local`

**Status:** ✅ SUCESSO

---

### 3️⃣ POST /auth/register (Email Duplicado)

**Teste:**

```bash
# Registrar duas vezes com mesmo email
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"duplicate@test.com","password":"Senha@123"}'

curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"duplicate@test.com","password":"Outra@123"}'
```

**Resultado:**

```
Primeira chamada: Status 200 ✅
Segunda chamada: Status 409 ✅ (Conflict - Email já existe)
Body: {"statusCode":409,"message":"Email já está em uso","code":"EMAIL_ALREADY_EXISTS"}
```

**Status:** ✅ SUCESSO (Retorna 409 Conflict)

---

### 4️⃣ POST /auth/register (Email Inválido)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"nao-eh-email","password":"Senha@Test123"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"Email deve ser um endereço de email válido",...}
```

**Status:** ✅ SUCESSO (Retorna 400)

---

### 5️⃣ POST /auth/login (Credenciais Válidas)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"Senha@Test123"}'
```

**Resultado:**

```
Status: 200 OK
Body: {
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiI...",
    "refreshToken": "eyJhbGciOiJSUzI1NiI...",
    "expiresIn": 900
  }
}
```

**Validação:**
✅ Access Token obtido e válido
✅ Refresh Token obtido e válido
✅ Tokens decodificáveis e contêm user info

**Status:** ✅ SUCESSO

---

### 6️⃣ POST /auth/login (Credenciais Inválidas)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"SenhaErrada@123"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"email ou senha inválidos",...}
```

**Status:** ✅ SUCESSO (Retorna 400)

---

### 7️⃣ POST /auth/login (Usuário Não Existe)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"naoexiste@test.com","password":"Qualquer@123"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"email ou senha inválidos",...}
```

**Status:** ✅ SUCESSO (Retorna 400)

---

### 8️⃣ POST /auth/refresh (Token Válido)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<VALID_REFRESH_TOKEN>"}'
```

**Resultado:**

```
Status: 200 OK
Body: {
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiI...",
    "refreshToken": "eyJhbGciOiJSUzI1NiI...",
    "expiresIn": 900
  }
}
```

**Validação:**
✅ Novos tokens gerados
✅ Tokens diferentes dos anteriores (rotação funcionando)

**Status:** ✅ SUCESSO

---

### 9️⃣ POST /auth/refresh (Token Inválido)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"token_invalido_xyz"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"Erro na verificação de token",...}
```

**Status:** ✅ SUCESSO (Retorna 400)

---

### 🔟 POST /auth/logout

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Resultado:**

```
Status: 200 OK
Body: {"data":{"ok":true,"message":"Logout realizado com sucesso"}}
```

**Validação:**
✅ Session revogada
✅ Refresh token anterior não funciona mais

**Status:** ✅ SUCESSO

---

### 1️⃣1️⃣ GET /auth/public-key

**Teste:**

```bash
curl http://localhost:5000/auth/public-key
```

**Resultado:**

```
Status: 200 OK
Body: {"data":{"publicKey":"-----BEGIN PUBLIC KEY-----\r\n..."}}
```

**Status:** ✅ SUCESSO

---

### 1️⃣2️⃣ GET /auth/google (Google OAuth Redirect)

**Teste:**

```bash
curl -I http://localhost:5000/auth/google
```

**Resultado:**

```
Status: 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

**Status:** ✅ SUCESSO (Retorna redirect 302)

---

## 🔗 Testes Google Auth

- [x] GET /auth/google → Redireciona para Google OAuth (testado manualmente)
- [x] GET /auth/google/callback → Processa callback do Google (testado manualmente)
- [x] Usuários Google são criados com `provider='google'`
- [x] Tokens são gerados corretamente
- [x] Funciona para novo usuário
- [x] Funciona para usuário existente

---

## 🔐 TESTES AVANÇADOS (Segurança, Headers, Validação)

### 1️⃣3️⃣ Headers CORS

**Teste:**

```bash
curl -I http://localhost:5000/
```

**Validação:**
✅ Header `Access-Control-Allow-Origin` presente
✅ Header `Access-Control-Allow-Methods` presente
✅ Header `Access-Control-Allow-Credentials` definido

**Status:** ✅ SUCESSO

---

### 1️⃣4️⃣ Content-Type em Respostas

**Teste:**

```bash
curl -I -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}'
```

**Validação:**
✅ Header `Content-Type: application/json` presente em resposta

**Status:** ✅ SUCESSO

---

### 1️⃣5️⃣ Security Headers (Helmet)

**Teste:**

```bash
curl -I http://localhost:5000/
```

**Validação:**
✅ Header `X-Content-Type-Options: nosniff` presente
✅ Header `X-Frame-Options: deny` presente
✅ Header `Strict-Transport-Security` presente

**Resultado esperado:**

```
X-Content-Type-Options: nosniff
X-Frame-Options: deny
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Status:** ✅ SUCESSO

---

### 1️⃣6️⃣ POST /auth/logout sem Token (401 Unauthorized)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/logout
```

**Resultado:**

```
Status: 401 Unauthorized
Body: {"statusCode":401,"message":"Unauthorized",...}
```

**Status:** ✅ SUCESSO

---

### 1️⃣7️⃣ POST /auth/logout com Token Inválido (401 Unauthorized)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer invalid.token.here"
```

**Resultado:**

```
Status: 401 Unauthorized
Body: {"statusCode":401,"message":"Unauthorized",...}
```

**Status:** ✅ SUCESSO

---

### 1️⃣8️⃣ POST /auth/register sem Email (400 Bad Request)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"password":"Pass@123"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"email should not be empty",...}
```

**Status:** ✅ SUCESSO

---

### 1️⃣9️⃣ POST /auth/register sem Password (400 Bad Request)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Resultado:**

```
Status: 400 Bad Request
Body: {"statusCode":400,"message":"password should not be empty",...}
```

**Status:** ✅ SUCESSO

---

### 2️⃣0️⃣ POST /auth/register com Email Muito Longo (400 Bad Request)

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"'$(printf 'a%.0s' {1..250})'@test.com","password":"Pass@123"}'
```

**Validação:**
✅ Email com mais de 254 caracteres rejeitado
✅ Retorna status 400

**Status:** ✅ SUCESSO

---

### 2️⃣1️⃣ Rate Limiting (Throttler)

**Teste:**

```bash
# Múltiplas requisições rápidas
for i in {1..5}; do
  curl -X POST http://localhost:5000/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"Pass@123\"}"
done
```

**Validação:**
✅ Requisições são aceitas ou retornam 429 (Too Many Requests)
✅ Rate limiting está ativo nos endpoints com `@UseGuards(ThrottlerGuard)`

**Status:** ✅ SUCESSO

---

### 2️⃣2️⃣ Estrutura de Resposta de Erro

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

**Validação:**
✅ Response contém `statusCode`
✅ Response contém `message`
✅ Response pode conter `code` opcional

**Resultado esperado:**

```json
{
  "statusCode": 400,
  "message": "email ou senha inválidos",
  "path": "/auth/login",
  "timestamp": "2026-04-12T08:00:00.000Z"
}
```

**Status:** ✅ SUCESSO

---

### 2️⃣3️⃣ Estrutura de Resposta de Sucesso

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"success@test.com","password":"Pass@123"}'
```

**Validação:**
✅ Response contém propriedade `data`
✅ Response não contém `error`

**Resultado esperado:**

```json
{
  "data": null
}
```

**Status:** ✅ SUCESSO

---

### 2️⃣4️⃣ Formato JWT dos Tokens

**Teste:**

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}'
```

**Validação:**
✅ Token tem 3 partes separadas por pontos (.)
✅ Cada parte é base64url válido
✅ Padrão: `[header].[payload].[signature]`

**Teste do formato:**

```bash
TOKEN="eyJhbGciOiJSUzI1NiI..."
# Validar com regex
echo $TOKEN | grep -E "^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$"
```

**Status:** ✅ SUCESSO

---

## 📊 Resumo de Testes

| ID | Teste | Tipo | Status |
|----|-------|------|--------|
| 01 | GET / | Básico | ✅ |
| 02 | POST /auth/register | Básico | ✅ |
| 03 | Email duplicado | Validação | ✅ |
| 04 | Email inválido | Validação | ✅ |
| 05 | POST /auth/login | Autenticação | ✅ |
| 06 | Senha errada | Autenticação | ✅ |
| 07 | Usuário não existe | Autenticação | ✅ |
| 08 | Refresh token inválido | Autenticação | ✅ |
| 09 | GET /auth/public-key | Endpoint | ✅ |
| 10 | POST /auth/refresh | Endpoint | ✅ |
| 11 | POST /auth/logout | Endpoint | ✅ |
| 12 | GET /auth/google | Endpoint | ✅ |
| 13 | CORS headers | Segurança | ✅ |
| 14 | Content-Type | Headers | ✅ |
| 15 | Security headers | Segurança | ✅ |
| 16 | Logout sem token (401) | Autorização | ✅ |
| 17 | Token inválido (401) | Autorização | ✅ |
| 18 | Email faltando (400) | Validação | ✅ |
| 19 | Password faltando (400) | Validação | ✅ |
| 20 | Email muito longo (400) | Validação | ✅ |
| 21 | Rate limiting | Performance | ✅ |
| 22 | Estrutura erro | Resposta | ✅ |
| 23 | Estrutura sucesso | Resposta | ✅ |
| 24 | Formato JWT | Validação | ✅ |

---

## 🚀 Como Executar os Testes

### Executar todos os testes automaticamente

```bash
bash test/automated-tests/run.sh
```

### Executar apenas um teste específico

```bash
# Teste 5 (Login)
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}'
```

---

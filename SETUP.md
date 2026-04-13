# Setup - Auth Service com Docker

### 1️⃣ Copiar arquivo de configuração

```bash
cp .env.example .env
```

### 2️⃣ Gerar chaves JWT

**Opção A - Automático (Linux/Mac/WSL):**

```bash
# Gerar chave privada
openssl genrsa -out private_key.pem 2048

# Gerar chave pública
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

Copie o conteúdo das chaves geradas para o `.env`:

```env
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...copie o conteúdo de private_key.pem aqui...
-----END PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...copie o conteúdo de public_key.pem aqui...
-----END PUBLIC KEY-----"
```

**Opção B - Online (Windows):**

- Acesse: https://travistidwell.com/jsencrypt/demo/
- Clique em "Generate New Key Pair"
- Copie as chaves para o `.env`

### 3️⃣ Configurar banco de dados

Edite o arquivo `.env` e preencha com seus dados:

```env
# Database - Apontar para seu servidor PostgreSQL
DB_HOST=seu-postgres-host.com    # ou localhost se local
DB_PORT=5432                      # porta padrão
DB_USER=seu-usuario
DB_PASSWORD=sua-senha-super-secreta
DB_NAME=auth_db

# Mantém as chaves JWT que você gerou acima
JWT_PRIVATE_KEY="..."
JWT_PUBLIC_KEY="..."

# Opcionais - Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://seu-dominio/auth/google/callback
CLIENT_REDIRECT_URL=https://seu-dominio/
```

### 4️⃣ Subir o Docker

```bash
docker-compose up -d
```

**Aguarde alguns segundos** e acesse: `http://localhost:3000`

---

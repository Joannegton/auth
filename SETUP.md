## ⚙️ Setup e Configuração

### 1. Gerar Chaves RSA

```bash
openssl genrsa -out .secrets/private.pem 2048
openssl rsa -in .secrets/private.pem -pubout -out .secrets/public.pem
```

### 2. Variáveis de Ambiente

```bash
cp .env.example .env
# Editar:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=auth_db

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_ACCESS_TOKEN_MINS_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN=7d
KEYS_DIR=.secrets
```

### 3. Executar Aplicação

```bash
npm install
npm run migration:run
npm run start:dev
```

---

## 🐳 Kubernetes Deployment

### Exemplo Deployment Manifest

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: auth-rsa-keys
type: Opaque
data:
    private-pem: <base64 encoded private.pem>
    public-pem: <base64 encoded public.pem>

---
apiVersion: apps/v1
kind: Deployment
metadata:
    name: auth-service
spec:
    replicas: 2
    selector:
        matchLabels:
            app: auth
    template:
        metadata:
            labels:
                app: auth
        spec:
            containers:
                - name: auth
                  image: auth:latest
                  ports:
                      - containerPort: 3000
                  env:
                      - name: DB_HOST
                        valueFrom:
                            configMapKeyRef:
                                name: auth-config
                                key: db-host
                      - name: GOOGLE_CLIENT_ID
                        valueFrom:
                            secretKeyRef:
                                name: auth-credentials
                                key: google-client-id
                  volumeMounts:
                      - name: rsa-keys
                        mountPath: /app/.secrets
                        readOnly: true
            volumes:
                - name: rsa-keys
                  secret:
                      secretName: auth-rsa-keys
                      items:
                          - key: private-pem
                            path: private.pem
                          - key: public-pem
                            path: public.pem
```

## 📊 Variáveis de Ambiente

```env
# Core
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db

# JWT
KEYS_DIR=.secrets
JWT_ACCESS_TOKEN_MINS_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_DAYS_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Flutter/Client
CLIENT_REDIRECT_URL=http://localhost:3000/auth/success
```

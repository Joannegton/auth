## 📱 Flutter Implementation

### Secure Token Storage

```dart
// Usando flutter_secure_storage para armazenar tokens de forma segura
final storage = FlutterSecureStorage();
await storage.write(key: 'access_token', value: accessToken);
await storage.write(key: 'refresh_token', value: refreshToken);
```

### Dio Interceptor Pattern

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // check para 401
    if (response.statusCode == 401) {
      // Chamar POST /auth/refresh com refresh_token
      // Atualizar tokens no storage
      // Repetir a requisição original com novo access token
    }
    handler.next(response);
  }
}
```

### PKCE (Mobile Seguro OAuth)

- Gerar code_verifier (random 128 chars)
- Gerar code_challenge = base64url(sha256(code_verifier))
- Enviar com requisição do Google OAuth
- Servidor verifica se code_challenge corresponde a code_verifier

## 🔍 Validação de Tokens

```typescript
// Public key (available at GET /auth/public-key)
const publicKey = `-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----`;

// Verify token
const decoded = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
});
// decoded = { sub: userId, email, iat, exp }
```

#!/bin/bash

cd "$(dirname "$0")/../../"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "================================================================"
echo "TESTES AUTOMATICOS - AUTH SERVICE"
echo "================================================================"
echo ""

echo "[1] Compilando..."
if ! npm run build 2>&1 | head -20; then
    echo -e "${RED}[ERRO] Falha ao compilar${NC}"
    exit 1
fi

echo "[2] Setup database..."
if ! npm run db:setup 2>&1 | head -20; then
    echo -e "${RED}[ERRO] Falha ao setup do banco${NC}"
    exit 1
fi

echo "[3] Iniciando servidor..."
npm run start:prod > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 5

echo "[4] Testando conexao..."
RETRY=0
MAX_RETRY=30
while ! curl -s http://localhost:5000/ > /dev/null 2>&1; do
    if [ $RETRY -ge $MAX_RETRY ]; then
        echo -e "${RED}[ERRO] Servidor nao iniciou${NC}"
        tail -50 /tmp/server.log
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    echo "Aguardando servidor... ($RETRY/$MAX_RETRY)"
    sleep 1
    ((RETRY++))
done

echo -e "${GREEN}[OK] Servidor online!${NC}"
echo ""
echo "================================================================"
echo "TESTES"
echo "================================================================"
echo ""

PASS=0
FAIL=0

# Função auxiliar para teste
test_case() {
    local name=$1
    local condition=$2

    if [ "$condition" -eq 0 ]; then
        echo -e "${GREEN}[OK]${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}[FAIL]${NC} $name"
        ((FAIL++))
    fi
}

# ============ TESTES BASICOS ============
echo -e "${YELLOW}=== TESTES BASICOS ===${NC}"

# Teste 1: GET /
curl -s http://localhost:5000/ > /tmp/test1.json
grep -q "Hello" /tmp/test1.json
test_case "TESTE 1: GET /" $?

# Teste 2: POST /auth/register
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}' > /tmp/test2.json
grep -q "data" /tmp/test2.json
test_case "TESTE 2: POST /auth/register" $?

# Teste 3: Email duplicado
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}' | grep -q "409"
test_case "TESTE 3: Email duplicado (409)" $?

# Teste 4: Email inválido
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"Pass@123"}' | grep -q "400"
test_case "TESTE 4: Email inválido (400)" $?

# ============ TESTE 5: CAPTURAR TOKENS ============
echo ""
echo -e "${YELLOW}=== CAPTURANDO TOKENS ===${NC}"

curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}' > /tmp/test5_response.json

echo "[DEBUG] Resposta do login:"
cat /tmp/test5_response.json | head -3

if grep -q "accessToken" /tmp/test5_response.json; then
    echo -e "${GREEN}[OK]${NC} TESTE 5: Login com sucesso"
    ((PASS++))
    # Extrai tokens
    GLOBAL_REFRESH_TOKEN=$(cat /tmp/test5_response.json | grep -o '"refreshToken":"[^"]*' | head -1 | cut -d'"' -f4)
    GLOBAL_ACCESS_TOKEN=$(cat /tmp/test5_response.json | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "[DEBUG] Token extraído (primeiros 50 chars): ${GLOBAL_ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}[FAIL]${NC} TESTE 5: Login"
    ((FAIL++))
    GLOBAL_REFRESH_TOKEN=""
    GLOBAL_ACCESS_TOKEN=""
fi

# ============ TESTES DE AUTENTICACAO ============
echo ""
echo -e "${YELLOW}=== TESTES DE AUTENTICACAO ===${NC}"

# Teste 6: Senha errada
curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Wrong"}' | grep -q "400"
test_case "TESTE 6: Senha errada (400)" $?

# Teste 7: Usuário não existe
curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notexist@test.com","password":"Pass@123"}' | grep -q "400"
test_case "TESTE 7: Usuário não existe (400)" $?

# Teste 8: Refresh token inválido
curl -s -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid"}' | grep -q "400"
test_case "TESTE 8: Refresh token inválido (400)" $?

# ============ TESTES DE ENDPOINTS ============
echo ""
echo -e "${YELLOW}=== TESTES DE ENDPOINTS ===${NC}"

# Teste 9: Public key
curl -s http://localhost:5000/auth/public-key | grep -q "publicKey"
test_case "TESTE 9: GET /auth/public-key" $?

# Teste 10: Refresh com token válido
if [ -n "$GLOBAL_REFRESH_TOKEN" ]; then
    echo "[DEBUG] TESTE 10: Refresh token disponível"
    curl -s -X POST http://localhost:5000/auth/refresh \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\":\"$GLOBAL_REFRESH_TOKEN\"}" > /tmp/test10_response.json
    echo "[DEBUG] Resposta refresh:"
    cat /tmp/test10_response.json | head -3
    grep -q "accessToken" /tmp/test10_response.json
    test_case "TESTE 10: Refresh token válido" $?
else
    echo -e "${RED}[FAIL]${NC} TESTE 10: Refresh token válido (token não disponível)"
    ((FAIL++))
fi

# Teste 11: Logout com token válido
if [ -n "$GLOBAL_ACCESS_TOKEN" ]; then
    echo "[DEBUG] TESTE 11: Access token disponível"
    curl -s -X POST http://localhost:5000/auth/logout \
      -H "Authorization: Bearer $GLOBAL_ACCESS_TOKEN" > /tmp/test11_response.json
    echo "[DEBUG] Resposta logout:"
    cat /tmp/test11_response.json | head -3
    grep -q "data" /tmp/test11_response.json
    test_case "TESTE 11: POST /auth/logout" $?
else
    echo -e "${RED}[FAIL]${NC} TESTE 11: POST /auth/logout (token não disponível)"
    ((FAIL++))
fi

# Teste 12: Google auth redirect
curl -s -I -X GET http://localhost:5000/auth/google 2>&1 | grep -q "302"
test_case "TESTE 12: GET /auth/google (302 redirect)" $?

# ============ TESTES DE VALIDACAO DE HEADERS ============
echo ""
echo -e "${YELLOW}=== TESTES DE HEADERS ===${NC}"

# Teste 13: CORS headers (precisa do header Origin na requisição)
echo "[DEBUG] TESTE 13: Verificando CORS headers..."
CORS_RESPONSE=$(curl -s -i -H "Origin: http://localhost:3000" http://localhost:5000/)
echo "[DEBUG] Headers da resposta GET / com Origin:"
echo "$CORS_RESPONSE" | grep -i "access-control\|vary"
CORS_HEADER=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | wc -l)
echo "[DEBUG] CORS_HEADER count: $CORS_HEADER"
[ $CORS_HEADER -gt 0 ]
test_case "TESTE 13: Header CORS presente" $?

# Teste 14: Content-Type em sucesso
echo "[DEBUG] TESTE 14: Verificando Content-Type..."
CONTENT_RESPONSE=$(curl -s -i -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass@123"}')
echo "[DEBUG] Headers da resposta POST /auth/login:"
echo "$CONTENT_RESPONSE" | head -15
CONTENT_TYPE=$(echo "$CONTENT_RESPONSE" | grep -i "^content-type:" | head -1)
echo "[DEBUG] Content-Type header: $CONTENT_TYPE"
echo "$CONTENT_TYPE" | grep -q "application/json"
test_case "TESTE 14: Content-Type application/json" $?

# Teste 15: Security headers (Helmet)
echo "[DEBUG] TESTE 15: Verificando Security headers..."
SECURITY_RESPONSE=$(curl -s -I http://localhost:5000/)
echo "[DEBUG] Headers de segurança:"
echo "$SECURITY_RESPONSE" | grep -E "X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security|X-XSS-Protection"
SECURITY_HEADERS=$(echo "$SECURITY_RESPONSE" | grep -E "X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security" | wc -l)
echo "[DEBUG] SECURITY_HEADERS count: $SECURITY_HEADERS"
[ $SECURITY_HEADERS -ge 2 ]
test_case "TESTE 15: Security headers presentes (Helmet)" $?

# ============ TESTES DE AUTORIZACAO ============
echo ""
echo -e "${YELLOW}=== TESTES DE AUTORIZACAO ===${NC}"

# Teste 16: Logout sem token (deve retornar 401)
echo "[DEBUG] TESTE 16: Logout sem token..."
LOGOUT_RESPONSE_16=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/auth/logout)
LOGOUT_STATUS=$(echo "$LOGOUT_RESPONSE_16" | tail -1)
LOGOUT_BODY=$(echo "$LOGOUT_RESPONSE_16" | head -1)
echo "[DEBUG] Status: $LOGOUT_STATUS"
echo "[DEBUG] Body: $LOGOUT_BODY"
[ "$LOGOUT_STATUS" = "401" ]
test_case "TESTE 16: Logout sem token retorna 401" $?

# Teste 17: Token inválido retorna 401
echo "[DEBUG] TESTE 17: Token inválido..."
echo "[DEBUG] Enviando: curl -X POST http://localhost:5000/auth/logout -H 'Authorization: Bearer invalid.token.here'"
INVALID_TOKEN_RESPONSE=$(curl -s -i -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer invalid.token.here")
echo "[DEBUG] Resposta completa do TESTE 17:"
echo "$INVALID_TOKEN_RESPONSE" | head -20
INVALID_TOKEN_STATUS=$(echo "$INVALID_TOKEN_RESPONSE" | grep "^HTTP" | grep -o "[0-9]\{3\}")
INVALID_TOKEN_BODY=$(echo "$INVALID_TOKEN_RESPONSE" | tail -1)
echo "[DEBUG] Status extraído: $INVALID_TOKEN_STATUS"
echo "[DEBUG] Body: $INVALID_TOKEN_BODY"

echo ""
echo "[DEBUG] Comparação:"
echo "[DEBUG] - Bearer vazio retorna 401 (correto)"
EMPTY_BEARER=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/auth/logout -H "Authorization: Bearer ")
echo "[DEBUG] - Bearer vazio status: $EMPTY_BEARER"
echo "[DEBUG] - Bearer invalid.token.here retorna $INVALID_TOKEN_STATUS (esperado: 401)"

[ "$INVALID_TOKEN_STATUS" = "401" ]
test_case "TESTE 17: Token inválido retorna 401" $?

# ============ TESTES DE VALIDACAO DE DADOS ============
echo ""
echo -e "${YELLOW}=== TESTES DE VALIDACAO DE DADOS ===${NC}"

# Teste 18: Email faltando
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"password":"Pass@123"}' | grep -q "400"
test_case "TESTE 18: Email faltando retorna 400" $?

# Teste 19: Password faltando
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | grep -q "400"
test_case "TESTE 19: Password faltando retorna 400" $?

# Teste 20: Email muito longo
LONG_EMAIL="$(printf 'a%.0s' {1..250})@test.com"
curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LONG_EMAIL\",\"password\":\"Pass@123\"}" | grep -q "400"
test_case "TESTE 20: Email muito longo retorna 400" $?

# ============ TESTES DE RATE LIMITING ============
echo ""
echo -e "${YELLOW}=== TESTES DE RATE LIMITING ===${NC}"

# Teste 21: Multiple requests rápidos
THROTTLE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"throttle@test.com","password":"Pass@123"}')
THROTTLE_STATUS=$(echo "$THROTTLE_RESPONSE" | tail -1)
([ "$THROTTLE_STATUS" = "200" ] || [ "$THROTTLE_STATUS" = "409" ] || [ "$THROTTLE_STATUS" = "429" ])
test_case "TESTE 21: Rate limiting ativo ou requisição aceita" $?

# ============ TESTES DE ESTRUTURA DE RESPOSTA ============
echo ""
echo -e "${YELLOW}=== TESTES DE ESTRUTURA DE RESPOSTA ===${NC}"

# Teste 22: Resposta de erro tem estrutura correta
ERROR_RESPONSE=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}')
echo "$ERROR_RESPONSE" | grep -q "statusCode\|message"
test_case "TESTE 22: Erro tem statusCode e message" $?

# Teste 23: Resposta de sucesso tem data
echo "[DEBUG] TESTE 23: Verificando estrutura de sucesso..."
UNIQUE_EMAIL="success_$(date +%s)@test.com"
SUCCESS_RESPONSE=$(curl -s -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$UNIQUE_EMAIL\",\"password\":\"Pass@123\"}")
echo "[DEBUG] Resposta success: $SUCCESS_RESPONSE"
echo "$SUCCESS_RESPONSE" | grep -q "data"
test_case "TESTE 23: Sucesso retorna data" $?

# Teste 24: Token tem formato JWT
TOKEN_FORMAT=$(echo "$GLOBAL_ACCESS_TOKEN" | grep -E "^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$" | wc -l)
[ $TOKEN_FORMAT -eq 1 ]
test_case "TESTE 24: Token tem formato JWT válido" $?

# ============ RESUMO ============
echo ""
echo "================================================================"
echo "RESULTADO"
echo "================================================================"
echo -e "${GREEN}Sucesso: $PASS${NC}"
echo -e "${RED}Falhas: $FAIL${NC}"

echo ""
echo "[INFO] Encerrando aplicação..."
if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
fi
pkill -f "node.*start:prod" 2>/dev/null || true

# Limpar arquivos temporários
rm -f /tmp/test*.json /tmp/server.log

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}TODOS OS TESTES PASSARAM!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}ALGUNS TESTES FALHARAM${NC}"
    exit 1
fi

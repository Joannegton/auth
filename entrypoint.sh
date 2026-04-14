#!/bin/sh
set -e

echo "Aguardando banco de dados estar disponível..."
node -e "
  const pg = require('pg');
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'auth_app',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth',
  });

  const maxAttempts = 30;
  let attempts = 0;

  const checkDb = async () => {
    try {
      await client.connect();
      await client.end();
      console.log('✓ Banco de dados disponível');
      process.exit(0);
    } catch (err) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('✗ Banco de dados não disponível após 30 tentativas');
        process.exit(1);
      }
      console.log(\`Tentativa \${attempts}/\${maxAttempts}...\`);
      setTimeout(checkDb, 1000);
    }
  };

  checkDb();
"

echo "Rodando migrations..."
npm run migration:run || {
  echo "✗ Erro ao rodar migrations"
  exit 1
}

echo "✓ Migrations completadas com sucesso"
echo "Iniciando aplicação..."

exec node dist/src/main

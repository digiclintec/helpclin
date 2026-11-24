#!/bin/bash
set -e

echo "=========================================================="
echo "🛠️ Configuração Automática do Banco de Dados HelpClin (VPS)"
echo "=========================================================="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Verificar/Instalar o serviço do PostgreSQL
echo ""
echo "🐘 1. Verificando serviço PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando PostgreSQL..."
  apt-get update && apt-get install -y postgresql postgresql-contrib
fi

systemctl enable postgresql || true
systemctl start postgresql || true

# 2. Criar usuário e banco de dados do HelpClin
echo ""
echo "🗄️ 2. Configurando usuário 'helpclin_admin' e banco 'helpclin'..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'helpclin_admin') THEN CREATE ROLE helpclin_admin LOGIN PASSWORD 'HelpClin2026!'; END IF; END \$\$;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER helpclin_admin WITH PASSWORD 'HelpClin2026!';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'helpclin'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE helpclin OWNER helpclin_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE helpclin TO helpclin_admin;"

# 3. Criar arquivo .env no backend
echo ""
echo "📄 3. Gerando arquivo .env da API..."
cat << 'EOF' > "$PROJECT_DIR/api - backend/.env"
PORT=3333
CLIENT_URL=https://helpclintec.com.br
DB_HOST=localhost
DB_PORT=5432
POSTGRES_DB=helpclin
POSTGRES_USER=helpclin_admin
POSTGRES_PASSWORD=HelpClin2026!
DB_POOL_MAX=10
DB_SSL=false
EOF
echo "Arquivo .env configurado com sucesso!"

# 4. Executar migrations para criar tabelas de chamados e ordens
echo ""
echo "📋 4. Aplicando migrations (Tabelas de Chamados, O.S. e Usuários)..."
cd "$PROJECT_DIR/api - backend"
npm install --production=false
node scripts/migrate.js

# 5. Criar/Garantir usuário administrador padrão para login
echo ""
echo "👤 5. Criando usuário administrador inicial..."
node -e "
import bcrypt from 'bcryptjs';
import pg from 'pg';
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'helpclin',
  user: 'helpclin_admin',
  password: 'HelpClin2026!'
});

async function setupAdmin() {
  try {
    const hash = await bcrypt.hash('12345678', 12);
    await pool.query(\`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ('Rodrigo Santos', 'digiclintec@gmail.com', \$1, 'admin', TRUE)
      ON CONFLICT (email) DO UPDATE 
      SET is_active = TRUE, role = 'admin';
    \`, [hash]);
    console.log('✅ Usuário administrador configurado: digiclintec@gmail.com');
  } catch (err) {
    console.error('Aviso ao configurar admin:', err.message);
  } finally {
    await pool.end();
  }
}
setupAdmin();
"

# 6. Reiniciar o serviço da API no PM2
echo ""
echo "🔄 6. Reiniciando API no PM2..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload all || pm2 restart all
fi

echo ""
echo "=========================================================="
echo "🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!"
echo "=========================================================="
echo "Usuário de acesso:"
echo "E-mail: digiclintec@gmail.com"
echo "Senha padrão: 12345678 (se a conta for nova, altere nas configurações)"
echo "=========================================================="

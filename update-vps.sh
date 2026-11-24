#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Atualizando HelpClin Completo na VPS (Git Pull)"
echo "=========================================================="

# 1. Garantir que estamos na raiz do projeto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "📥 1. Sincronizando com as últimas alterações do GitHub..."
git reset --hard HEAD
git pull origin main

echo ""
echo "⚙️ 2. Atualizando Backend (API & Banco de Dados)..."
cd "$PROJECT_DIR/api - backend"

# Instalar dependências da API caso necessário
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
  echo "📦 Instalando/atualizando dependências do Backend..."
  npm install --production=false
fi

# Rodar migrations no banco PostgreSQL
echo "🗄️ Executando migrations do Banco de Dados..."
if [ -f "scripts/migrate.js" ]; then
  node scripts/migrate.js || echo "⚠️ Aviso: Verifique as credenciais do banco no .env caso a migration tenha falhado."
fi

# Reiniciar o serviço do Backend na VPS
echo "🔄 Reiniciando serviço da API..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload all || pm2 restart all || echo "⚠️ PM2 não conseguiu reiniciar automaticamente."
elif systemctl is-active --quiet helpclin-api 2>/dev/null; then
  sudo systemctl restart helpclin-api
elif systemctl is-active --quiet helpclin 2>/dev/null; then
  sudo systemctl restart helpclin
fi

echo ""
echo "📦 3. Compilando o Frontend Web..."
cd "$PROJECT_DIR/web - frontend"

if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
  echo "📦 Instalando/atualizando dependências do Frontend..."
  npm install
fi

echo "🏗️ Gerando build de produção..."
npm run build

echo ""
echo "🌐 4. Publicando arquivos no Nginx..."
NGINX_TARGET="/etc/icontainer/apps/nginx/nginx/www/sites/helpclintec.com.br/index"
mkdir -p "$NGINX_TARGET"
cp -r dist/* "$NGINX_TARGET/"

echo ""
echo "🔍 5. Testando integridade dos serviços..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" https://api.helpclintec.com.br/api/health | grep -q "200"; then
  echo "✅ API Online!"
else
  echo "⚠️ Verifique se o backend está ativo na porta correspondente."
fi

echo ""
echo "=========================================================="
echo "✅ Atualização concluída com sucesso via Git!"
echo "Pressione Ctrl + Shift + R no navegador para limpar o cache."
echo "=========================================================="


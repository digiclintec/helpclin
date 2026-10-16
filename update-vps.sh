#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Atualizando HelpClin na VPS"
echo "=========================================="

# Garantir que estamos na raiz do projeto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "📥 1. Puxando as últimas alterações do GitHub..."
git pull origin main

echo "📦 2. Verificando dependências do frontend..."
cd "$PROJECT_DIR/web - frontend"

# Se o vite não estiver instalado, roda npm install
if [ ! -f "node_modules/.bin/vite" ]; then
  echo "Instalando dependências (npm install)... isso pode levar 1 minuto..."
  npm install
fi

echo "⚙️  3. Compilando o Frontend (npm run build)..."
npm run build

echo "🌐 4. Publicando no Nginx do iContainer..."
NGINX_TARGET="/etc/icontainer/apps/nginx/nginx/www/sites/helpclintec.com.br/index"
mkdir -p "$NGINX_TARGET"
cp -r dist/* "$NGINX_TARGET/"

echo "=========================================="
echo "✅ Atualização concluída com sucesso!"
echo "Pressione Ctrl + Shift + R no navegador para ver as alterações."
echo "=========================================="

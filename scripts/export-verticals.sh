#!/bin/bash
# ==============================================================================
# Script de Exportação e Separação das Verticais HelpClin em Projetos Standalone
# HelpClin v2.4 - Gestão de Módulos Independentes
# ==============================================================================

set -e

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT_DIR="$(dirname "$SOURCE_DIR")"

echo "=========================================================="
echo "🚀 Iniciando Separação dos Projetos HelpClin por Vertente"
echo "Origem: $SOURCE_DIR"
echo "Destino: $PARENT_DIR"
echo "=========================================================="

export_vertical() {
  local ID=$1
  local NAME=$2
  local TARGET_DIR="$PARENT_DIR/$NAME"

  echo ""
  echo "----------------------------------------------------------"
  echo "📦 Criando Projeto Isolado: $NAME ($ID)"
  echo "Destino: $TARGET_DIR"
  echo "----------------------------------------------------------"

  if [ -d "$TARGET_DIR" ]; then
    echo "⚠️  A pasta $TARGET_DIR já existe. Criando backup..."
    mv "$TARGET_DIR" "${TARGET_DIR}_backup_$(date +%s)"
  fi

  mkdir -p "$TARGET_DIR"

  # Copiar arquivos de frontend e backend (excluindo node_modules e .git antigo)
  echo "📁 Copiando arquivos essenciais do projeto..."
  rsync -av --progress "$SOURCE_DIR/" "$TARGET_DIR/" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'dist-*' \
    --exclude '.DS_Store' \
    --exclude '*.log'

  # Configurar o .env padrão do frontend para a vertente correspondente
  echo "⚙️ Configurando variáveis de ambiente exclusivas para $ID..."
  if [ -f "$TARGET_DIR/web - frontend/.env.$ID" ]; then
    cp "$TARGET_DIR/web - frontend/.env.$ID" "$TARGET_DIR/web - frontend/.env"
    cp "$TARGET_DIR/web - frontend/.env.$ID" "$TARGET_DIR/web - frontend/.env.prd"
  fi

  # Criar README exclusivo para o projeto da vertente
  cat <<EOF > "$TARGET_DIR/README.md"
# $NAME

Sistema independente **HelpClin** para a vertical de **$ID**.

## 📌 Escopo Exclusivo
- Vertente Ativa: **$ID**
- Projeto isolado com repositório próprio e deploy desacoplado.

## 🚀 Como Iniciar

### Frontend:
\`\`\`bash
cd "web - frontend"
yarn install
yarn dev
\`\`\`

### Backend:
\`\`\`bash
cd "api - backend"
yarn install
yarn dev
\`\`\`

## 📦 Como Subir para o GitHub Exclusivo:
\`\`\`bash
git init
git add .
git commit -m "feat: inicializacao do projeto independente $NAME"
git branch -M main
git remote add origin https://github.com/digiclintec/$NAME.git
git push -u origin main
\`\`\`
EOF

  echo "✅ Projeto $NAME pronto em: $TARGET_DIR"
}

# 1. Exportar HelpClin T.I.
export_vertical "ti" "helpclin-ti"

# 2. Exportar HelpClin Engenharia Clínica
export_vertical "clinica" "helpclin-engenharia-clinica"

# 3. Exportar HelpClin Engenharia Predial
export_vertical "predial" "helpclin-engenharia-predial"

echo ""
echo "=========================================================="
echo "🎉 Separação Concluída com Sucesso!"
echo "3 projetos independentes criados em:"
echo "1. $PARENT_DIR/helpclin-ti"
echo "2. $PARENT_DIR/helpclin-engenharia-clinica"
echo "3. $PARENT_DIR/helpclin-engenharia-predial"
echo "=========================================================="

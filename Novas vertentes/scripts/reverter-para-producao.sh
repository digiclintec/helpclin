#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 1. Criando cópia de segurança na pasta 'Novas vertentes'"
echo "=========================================================="
node scripts/setup-novas-vertentes.js

if [ ! -d "Novas vertentes/web - frontend" ]; then
  echo "❌ Erro: A pasta 'Novas vertentes' não foi criada corretamente. Abortando."
  exit 1
fi

echo ""
echo "=========================================================="
echo "🛡️  2. Protegendo 'Novas vertentes' no .gitignore"
echo "=========================================================="
if ! grep -q "Novas vertentes" .gitignore 2>/dev/null; then
  echo -e "\n# Backup de novas vertentes\nNovas vertentes/\n" >> .gitignore
fi

echo ""
echo "=========================================================="
echo "⏪ 3. Revertendo Git para a versão de produção (helpclintec.com.br)"
echo "   Commit alvo: 0e39a5b49606fdd743ca67e5f5150e86820449e9"
echo "=========================================================="
git reset --hard 0e39a5b49606fdd743ca67e5f5150e86820449e9

echo ""
echo "=========================================================="
echo "🌐 4. Sincronizando com o GitHub remoto (origin main)"
echo "=========================================================="
git push origin main --force

echo ""
echo "=========================================================="
echo "✅ CONCLUÍDO COM SUCESSO!"
echo "=========================================================="
echo "1. Seu projeto principal e o repositório GitHub voltaram exatamente ao estado de produção (helpclintec.com.br)."
echo "2. Todas as novas vertentes e atualizações estão salvas em: 'Novas vertentes/'"
echo "=========================================================="

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetDir = path.join(rootDir, 'Novas vertentes');

console.log('====================================================');
console.log('📁 Criando pasta "Novas vertentes" com a cópia atual');
console.log('====================================================');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const IGNORE_LIST = [
  'node_modules',
  'node_modules - Copia',
  '.git',
  'dist',
  'dist-ti',
  'dist-clinica',
  'dist-predial',
  'Novas vertentes',
  '.DS_Store'
];

function copyRecursiveSync(src, dest) {
  const base = path.basename(src);
  if (IGNORE_LIST.includes(base)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar web - frontend
console.log('📦 Copiando web - frontend (com todas as telas e componentes novos)...');
copyRecursiveSync(path.join(rootDir, 'web - frontend'), path.join(targetDir, 'web - frontend'));

// Copiar api - backend
console.log('📦 Copiando api - backend...');
copyRecursiveSync(path.join(rootDir, 'api - backend'), path.join(targetDir, 'api - backend'));

// Copiar scripts
if (fs.existsSync(path.join(rootDir, 'scripts'))) {
  console.log('📦 Copiando scripts...');
  copyRecursiveSync(path.join(rootDir, 'scripts'), path.join(targetDir, 'scripts'));
}

// Copiar documentação
if (fs.existsSync(path.join(rootDir, 'atualizacao'))) {
  console.log('📦 Copiando atualizacao...');
  copyRecursiveSync(path.join(rootDir, 'atualizacao'), path.join(targetDir, 'atualizacao'));
}

// Copiar arquivos raiz adicionais
if (fs.existsSync(path.join(rootDir, 'generate_update_pdf.py'))) {
  fs.copyFileSync(path.join(rootDir, 'generate_update_pdf.py'), path.join(targetDir, 'generate_update_pdf.py'));
}
if (fs.existsSync(path.join(rootDir, 'README.md'))) {
  fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(targetDir, 'README_ORIGINAL.md'));
}

// Criar README explicativo em Novas vertentes
const readme = `# HelpClin - Novas Vertentes (Backup Completo das Atualizações)

Esta pasta contém a versão atualizada e modular com todas as melhorias desenvolvidas:
1. **Planos Recorrentes**: Tabela em lista, gráfico mensal de distribuição (12 meses) e modal de criação de planos.
2. **Barra Lateral Simplificada**: Sem submenus expansíveis/acordeões complexos, navegação direta por clique único.
3. **Configurações Desconstruídas**: Painel executivo modular em cards independentes (T.I., Clínica, Predial e Contrato), com tema escuro 100% calibrado sem caixas brancas.
4. **Separação por Vertente**: Presets e scripts para rodar T.I., Clínica e Predial separadamente.

## Como rodar o frontend desta pasta:
\`\`\`bash
cd "Novas vertentes/web - frontend"
yarn install
yarn dev:ti       # Para T.I.
yarn dev:clinica  # Para Engenharia Clínica
yarn dev:predial  # Para Engenharia Predial
\`\`\`
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), readme, 'utf-8');

console.log('✅ Pasta "Novas vertentes" criada e populada com sucesso!');
console.log(`Localização: ${targetDir}`);
console.log('====================================================');

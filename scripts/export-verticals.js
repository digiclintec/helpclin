import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(sourceDir, '..');

const VERTICALS = [
  {
    id: 'ti',
    slug: 'helpclin-ti',
    title: 'HelpClin T.I. em Saúde',
    desc: 'Sistema exclusivo para suporte técnico a Prontuário Eletrônico (PEP), redes assistenciais, servidores PACS e impressoras Zebra.'
  },
  {
    id: 'clinica',
    slug: 'helpclin-engenharia-clinica',
    title: 'HelpClin Engenharia Clínica',
    desc: 'Sistema exclusivo para gestão de parque biomédico, calibrações rastreáveis RBC, manutenções preventivas e laudos ANVISA/ONA.'
  },
  {
    id: 'predial',
    slug: 'helpclin-engenharia-predial',
    title: 'HelpClin Predial & Facilities',
    desc: 'Sistema exclusivo para infraestrutura hospitalar crítica: grupos geradores, QTA, oxigênio medicinal, vácuo clínico e PMOC.'
  }
];

const IGNORE_PATTERNS = [
  'node_modules',
  'node_modules - Copia',
  '.git',
  'dist',
  'dist-ti',
  'dist-clinica',
  'dist-predial',
  '.DS_Store'
];

function shouldIgnore(srcPath) {
  const base = path.basename(srcPath);
  return IGNORE_PATTERNS.includes(base);
}

function copyRecursive(src, dest) {
  if (shouldIgnore(src)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('========================================================');
console.log('🚀 Iniciando Separação dos Projetos HelpClin por Vertente');
console.log(`Origem: ${sourceDir}`);
console.log(`Destino dos Projetos: ${parentDir}`);
console.log('========================================================\n');

for (const v of VERTICALS) {
  const targetDir = path.join(parentDir, v.slug);
  console.log(`📦 Gerando Projeto: ${v.title} (${v.slug})...`);

  if (fs.existsSync(targetDir)) {
    const backupName = `${v.slug}_backup_${Date.now()}`;
    console.log(`   ⚠️ Pasta existente detectada. Renomeando para ${backupName}`);
    fs.renameSync(targetDir, path.join(parentDir, backupName));
  }

  fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(sourceDir, targetDir);

  // Copiar o arquivo .env correspondente
  const envSrc = path.join(targetDir, 'web - frontend', `.env.${v.id}`);
  const envDest = path.join(targetDir, 'web - frontend', '.env');
  const envPrdDest = path.join(targetDir, 'web - frontend', '.env.prd');

  if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, envDest);
    fs.copyFileSync(envSrc, envPrdDest);
    console.log(`   ⚙️ Variáveis de ambiente vinculadas (.env.${v.id} -> .env)`);
  }

  // Criar README personalizado
  const readmeContent = `# ${v.title}

${v.desc}

## 📌 Configuração da Vertente
- Identificador: **${v.id}**
- Repositório Independente: **${v.slug}**

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

## 📦 Subir para o GitHub Exclusivo deste Projeto:
\`\`\`bash
git init
git add .
git commit -m "feat: inicializacao do projeto independente ${v.title}"
git branch -M main
git remote add origin https://github.com/digiclintec/${v.slug}.git
git push -u origin main
\`\`\`
`;

  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
  console.log(`   ✅ Projeto pronto em: ${targetDir}\n`);
}

console.log('========================================================');
console.log('🎉 Separação Concluída com Sucesso!');
console.log('Os 3 projetos independentes foram criados com sucesso.');
console.log('========================================================');

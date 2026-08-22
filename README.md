# HelpClin

Sistema criado por Daniel Knaip e Rodrigo Santos.

O **HelpClin** é um sistema completo desenvolvido para a gestão e suporte (Service Orders & Tickets), divido em duas aplicações: uma API (Backend) e uma Aplicação Web (Frontend).

## 🚀 Tecnologias Utilizadas

### Backend (`api - backend`)
- **Node.js**
- **Express** (Roteamento e API REST)
- **PostgreSQL (pg)** (Banco de dados)
- **Bcrypt.js** (Criptografia)
- **Dotenv** (Gerenciamento de variáveis de ambiente)

### Frontend (`web - frontend`)
- **React.js**
- **Vite** (Build tool rápida)
- **Lucide React** (Ícones)

---

## 🛠️ Como rodar o projeto localmente

Siga os passos abaixo para configurar e executar as duas aplicações na sua máquina.

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 20+ recomendada)
- [Yarn](https://yarnpkg.com/) ou NPM
- [PostgreSQL](https://www.postgresql.org/) rodando localmente

### 1. Configurando o Banco de Dados (Backend)

1. Acesse a pasta do backend:
   ```bash
   cd "api - backend"
   ```
2. Instale as dependências:
   ```bash
   yarn install
   # ou npm install
   ```
3. Configure o arquivo `.env`:
   - Copie o arquivo de exemplo para criar o seu arquivo `.env` local:
     ```bash
     cp .env.example .env
     ```
   - Abra o `.env` e configure a conexão com o seu banco de dados PostgreSQL.
4. Rode as migrations para criar as tabelas no banco de dados:
   ```bash
   yarn migrate
   # ou npm run migrate
   ```
5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   yarn dev
   # ou npm run dev
   ```
   *O backend estará rodando e escutando requisições.*

### 2. Configurando o Frontend

1. Abra um novo terminal e acesse a pasta do frontend:
   ```bash
   cd "web - frontend"
   ```
2. Instale as dependências:
   ```bash
   yarn install
   # ou npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Certifique-se de que a variável `VITE_API_URL` aponte para a URL do seu backend local.
4. Inicie o servidor de desenvolvimento:
   ```bash
   yarn dev
   # ou npm run dev
   ```
   *O Vite iniciará o servidor e mostrará a URL local (ex: http://localhost:5173).*

---

## 📦 Scripts Disponíveis

### Backend
- `yarn dev` : Roda a API em modo de desenvolvimento (com node --watch).
- `yarn start` : Inicia a API normalmente.
- `yarn migrate` : Executa as migrations de banco de dados com base no `.env`.
- `yarn start:hml` / `yarn start:prd` : Inicia o ambiente de homologação ou produção.

### Frontend
- `yarn dev` : Inicia a interface web em desenvolvimento com Hot Reload.
- `yarn build` : Cria a versão de produção.
- `yarn preview` : Pré-visualiza localmente a versão gerada pelo build.

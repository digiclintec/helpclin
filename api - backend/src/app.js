import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../public');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174'
].filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for development/hml
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// Servir arquivos estáticos da pasta public
app.use(express.static(publicPath));

// Rota raiz: serve página HTML de status no navegador ou JSON caso solicitado
app.get('/', (request, response) => {
  if (request.accepts('html')) {
    return response.sendFile(path.join(publicPath, 'index.html'));
  }
  return response.json({ name: 'HelpClin API', status: 'online' });
});

app.get('/status', (_request, response) => {
  response.sendFile(path.join(publicPath, 'index.html'));
});

app.use('/api', apiRoutes);

app.use((_request, response) => {
  response.status(404).json({ message: 'Rota não encontrada' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: 'Erro interno do servidor' });
});

export default app;

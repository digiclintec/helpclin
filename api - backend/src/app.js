import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_request, response) => {
  response.json({ name: 'HelpClin API', status: 'online' });
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

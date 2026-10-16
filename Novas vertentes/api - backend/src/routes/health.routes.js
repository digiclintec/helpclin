import { Router } from 'express';
import { checkDatabaseConnection } from '../database.js';

const router = Router();

router.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'helpclin-api',
    timestamp: new Date().toISOString()
  });
});

router.get('/db', async (_request, response) => {
  try {
    await checkDatabaseConnection();
    response.json({ status: 'ok', service: 'postgresql' });
  } catch (error) {
    console.error('Health check PostgreSQL falhou:', error.message);
    response.status(503).json({ status: 'error', service: 'postgresql' });
  }
});

export default router;

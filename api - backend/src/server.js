import 'dotenv/config';
import app from './app.js';
import { closeDatabaseConnection } from './database.js';

const port = Number(process.env.PORT) || 3333;

const server = app.listen(port, () => {
  console.log(`HelpClin API disponível em http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`Recebido ${signal}. Encerrando HelpClin API...`);
  server.close(async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

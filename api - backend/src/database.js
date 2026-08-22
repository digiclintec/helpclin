import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.POSTGRES_DB ?? process.env.DB_NAME,
  user: process.env.POSTGRES_USER ?? process.env.DB_USER,
  password: process.env.POSTGRES_PASSWORD ?? process.env.DB_PASSWORD,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (error) => {
  console.error('Erro inesperado no pool PostgreSQL:', error.message);
});

export async function checkDatabaseConnection() {
  await pool.query('SELECT 1');
}

export async function closeDatabaseConnection() {
  await pool.end();
}

export default pool;

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pool from '../src/database.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(currentDirectory, '..', 'migrations');

try {
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migration = await readFile(path.join(migrationsDirectory, migrationFile), 'utf8');
    await pool.query(migration);
    console.log(`Migration ${migrationFile} aplicada com sucesso.`);
  }
} catch (error) {
  console.error('Falha ao aplicar migration:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

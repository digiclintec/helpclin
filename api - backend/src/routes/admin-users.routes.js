import { Router } from 'express';

import pool from '../database.js';

const router = Router();

async function ensureAdmin(adminId) {
  if (!adminId) return false;
  const result = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = TRUE', [adminId, 'admin']);
  return result.rowCount > 0;
}

router.get('/pending', async (request, response) => {
  try {
    if (!await ensureAdmin(request.query.adminId)) return response.status(403).json({ message: 'Apenas administradores podem visualizar novos cadastros.' });
    const result = await pool.query(`SELECT id, name, email, role, created_at FROM users WHERE is_active = FALSE ORDER BY created_at ASC`);
    return response.json({ users: result.rows });
  } catch (error) {
    console.error('Falha ao listar usuários pendentes:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os cadastros pendentes.' });
  }
});

router.patch('/:id/approve', async (request, response) => {
  try {
    if (!await ensureAdmin(request.body.adminId)) return response.status(403).json({ message: 'Apenas administradores podem aprovar usuários.' });
    const result = await pool.query(`UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1 AND is_active = FALSE RETURNING id, name, email, role, is_active`, [request.params.id]);
    if (!result.rowCount) return response.status(404).json({ message: 'Usuário pendente não encontrado.' });
    return response.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Falha ao aprovar usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível aprovar o usuário.' });
  }
});

export default router;
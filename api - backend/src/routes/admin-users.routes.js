import bcrypt from 'bcryptjs';
import { Router } from 'express';

import pool from '../database.js';

const router = Router();

async function ensureAdmin(adminId) {
  if (!adminId) return false;
  const result = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = TRUE', [adminId, 'admin']);
  return result.rowCount > 0;
}

router.get('/', async (request, response) => {
  try {
    if (!await ensureAdmin(request.query.adminId)) {
      return response.status(403).json({ message: 'Apenas administradores podem visualizar os usuários.' });
    }
    const result = await pool.query(`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users
      ORDER BY is_active ASC, created_at DESC
    `);
    return response.json({ users: result.rows });
  } catch (error) {
    console.error('Falha ao listar usuários:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os usuários.' });
  }
});

router.get('/pending', async (request, response) => {
  try {
    if (!await ensureAdmin(request.query.adminId)) {
      return response.status(403).json({ message: 'Apenas administradores podem visualizar novos cadastros.' });
    }
    const result = await pool.query(`SELECT id, name, email, role, is_active, created_at FROM users WHERE is_active = FALSE ORDER BY created_at ASC`);
    return response.json({ users: result.rows });
  } catch (error) {
    console.error('Falha ao listar usuários pendentes:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os cadastros pendentes.' });
  }
});

router.patch('/:id/approve', async (request, response) => {
  try {
    if (!await ensureAdmin(request.body.adminId)) {
      return response.status(403).json({ message: 'Apenas administradores podem aprovar usuários.' });
    }
    const result = await pool.query(`UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role, is_active`, [request.params.id]);
    if (!result.rowCount) return response.status(404).json({ message: 'Usuário não encontrado.' });
    return response.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Falha ao aprovar usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível aprovar o usuário.' });
  }
});

router.patch('/:id', async (request, response) => {
  const { adminId, name, email, role, is_active, password } = request.body;
  try {
    if (!await ensureAdmin(adminId)) {
      return response.status(403).json({ message: 'Apenas administradores podem editar usuários.' });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;

    let query = `
      UPDATE users 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          is_active = COALESCE($4, is_active),
          updated_at = NOW()
    `;
    const params = [name?.trim(), normalizedEmail, role, is_active];

    if (password && password.length >= 8) {
      const passwordHash = await bcrypt.hash(password, 12);
      query += `, password_hash = $5 WHERE id = $6 RETURNING id, name, email, role, is_active, updated_at`;
      params.push(passwordHash, request.params.id);
    } else {
      query += ` WHERE id = $5 RETURNING id, name, email, role, is_active, updated_at`;
      params.push(request.params.id);
    }

    const result = await pool.query(query, params);
    if (!result.rowCount) return response.status(404).json({ message: 'Usuário não encontrado.' });
    return response.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'Este e-mail já está cadastrado para outro usuário.' });
    }
    console.error('Falha ao editar usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível editar o usuário.' });
  }
});

router.delete('/:id', async (request, response) => {
  const adminId = request.query.adminId || request.body.adminId;
  const targetId = request.params.id;
  try {
    if (!await ensureAdmin(adminId)) {
      return response.status(403).json({ message: 'Apenas administradores podem excluir usuários.' });
    }
    if (targetId === adminId) {
      return response.status(400).json({ message: 'Você não pode excluir a sua própria conta de administrador.' });
    }

    // Safely reassign/unlink dependencies
    await pool.query('UPDATE support_tickets SET assigned_to = NULL WHERE assigned_to = $1', [targetId]);
    await pool.query('UPDATE service_orders SET technician_id = NULL WHERE technician_id = $1', [targetId]);
    await pool.query('UPDATE support_tickets SET created_by = $1 WHERE created_by = $2', [adminId, targetId]);
    await pool.query('UPDATE service_orders SET created_by = $1 WHERE created_by = $2', [adminId, targetId]);

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [targetId]);
    if (!result.rowCount) return response.status(404).json({ message: 'Usuário não encontrado.' });

    return response.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Falha ao excluir usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível excluir o usuário.' });
  }
});

export default router;
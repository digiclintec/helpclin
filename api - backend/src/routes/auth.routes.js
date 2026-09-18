import bcrypt from 'bcryptjs';
import { Router } from 'express';

import pool from '../database.js';

const router = Router();

router.post('/register', async (request, response) => {
  const { name, email, password } = request.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!name?.trim() || !normalizedEmail || !password) {
    return response.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (password.length < 8) {
    return response.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
      RETURNING id, name, email, role, is_active, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return response.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    }

    console.error('Falha ao cadastrar usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível cadastrar o usuário.' });
  }
});

router.post('/login', async (request, response) => {
  const { email, password } = request.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !password) {
    return response.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = result.rows[0];
    const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return response.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (!user.is_active) {
      return response.status(403).json({ message: 'Seu cadastro aguarda aprovação de um administrador.' });
    }

    return response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Falha ao autenticar usuário:', error.message);
    return response.status(500).json({ message: 'Não foi possível realizar o login.' });
  }
});

export default router;

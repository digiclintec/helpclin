import { Router } from 'express';
import pool from '../database.js';

const router = Router();

router.get('/', async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, equipment_type, serial_number, status, location, created_at, updated_at
       FROM inventory_equipments ORDER BY created_at DESC`
    );
    return response.json({ equipments: result.rows });
  } catch (error) {
    console.error('Falha ao listar equipamentos:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os equipamentos.' });
  }
});

router.post('/', async (request, response) => {
  const { name, equipmentType, serialNumber, status = 'Ativo', location } = request.body;

  if (!name?.trim() || !equipmentType?.trim()) {
    return response.status(400).json({ message: 'Nome e Tipo do equipamento são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inventory_equipments (name, equipment_type, serial_number, status, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, equipment_type, serial_number, status, location, created_at`,
      [name.trim(), equipmentType.trim(), serialNumber?.trim() || null, status, location?.trim() || null]
    );

    return response.status(201).json({ equipment: result.rows[0] });
  } catch (error) {
    console.error('Falha ao cadastrar equipamento:', error.message);
    return response.status(500).json({ message: 'Não foi possível cadastrar o equipamento.' });
  }
});

router.patch('/:id', async (request, response) => {
  const { name, equipmentType, serialNumber, status, location } = request.body;

  try {
    const result = await pool.query(
      `UPDATE inventory_equipments 
       SET name = COALESCE($1, name), 
           equipment_type = COALESCE($2, equipment_type), 
           serial_number = COALESCE($3, serial_number), 
           status = COALESCE($4, status), 
           location = COALESCE($5, location), 
           updated_at = NOW()
       WHERE id = $6 RETURNING id, name, equipment_type, serial_number, status, location, updated_at`,
      [name?.trim(), equipmentType?.trim(), serialNumber?.trim(), status, location?.trim(), request.params.id]
    );

    if (!result.rowCount) {
      return response.status(404).json({ message: 'Equipamento não encontrado.' });
    }

    return response.json({ equipment: result.rows[0] });
  } catch (error) {
    console.error('Falha ao editar equipamento:', error.message);
    return response.status(500).json({ message: 'Não foi possível editar o equipamento.' });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const result = await pool.query('DELETE FROM inventory_equipments WHERE id = $1', [request.params.id]);
    if (!result.rowCount) {
      return response.status(404).json({ message: 'Equipamento não encontrado.' });
    }
    return response.status(204).send();
  } catch (error) {
    console.error('Falha ao remover equipamento:', error.message);
    return response.status(500).json({ message: 'Não foi possível remover o equipamento.' });
  }
});

export default router;

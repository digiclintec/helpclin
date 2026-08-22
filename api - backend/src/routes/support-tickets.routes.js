import { Router } from 'express';

import pool from '../database.js';

const router = Router();
const priorityMap = { Normal: 'normal', Alta: 'high', Urgente: 'urgent' };

router.get('/', async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT st.id, st.ticket_number, st.service_order_number, st.title, st.requester, st.ticket_type, st.company_sector, st.location, st.related_problem, st.observations, st.attachment_name, st.priority, st.status, st.created_at, st.assigned_to, assigned.name AS assigned_to_name, st.equipment_id, eq.name AS equipment_name
       FROM support_tickets st LEFT JOIN users assigned ON assigned.id = st.assigned_to LEFT JOIN inventory_equipments eq ON eq.id = st.equipment_id ORDER BY st.created_at DESC`
    );
    return response.json({ tickets: result.rows });
  } catch (error) {
    console.error('Falha ao listar chamados:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os chamados.' });
  }
});

router.post('/:id/assign', async (request, response) => {
  const { userId } = request.body;

  if (!userId) {
    return response.status(400).json({ message: 'Usuário atendente é obrigatório.' });
  }

  try {
    const assignedUser = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = TRUE', [userId]);
    if (assignedUser.rowCount === 0) {
      return response.status(400).json({ message: 'Usuário atendente não encontrado.' });
    }

    const result = await pool.query(
      `UPDATE support_tickets AS ticket
      SET assigned_to = $1, status = 'in_progress', updated_at = NOW()
       WHERE ticket.id = $2 AND ticket.status NOT IN ('resolved', 'cancelled')
       RETURNING ticket.id, ticket.service_order_number, ticket.status, ticket.assigned_to`,
      [userId, request.params.id]
    );

    if (result.rowCount === 0) {
      return response.status(409).json({ message: 'Chamado não disponível para atendimento.' });
    }

    const ticketDetails = await pool.query('SELECT ticket_number, title, requester, description, ticket_type, company_sector, location, related_problem, observations, priority, created_by, equipment_id FROM support_tickets WHERE id = $1', [request.params.id]);
    const source = ticketDetails.rows[0];
    const order = await pool.query(
      `INSERT INTO service_orders (order_number, patient_name, service_type, priority, description, service_requested_description, status, created_by, support_ticket_id, technician_id, equipment_id)
       VALUES ($1, $2, $3, $4, $5, $5, 'in_progress', $6, $7, $8, $9)
       ON CONFLICT (support_ticket_id) DO UPDATE SET technician_id = EXCLUDED.technician_id, order_number = EXCLUDED.order_number, status = 'in_progress', updated_at = NOW(), equipment_id = EXCLUDED.equipment_id
       RETURNING id, order_number, patient_name, service_type, priority, description, status, technician_id, equipment_id`,
      [source.ticket_number, source.requester, source.title, source.priority, source.observations, source.created_by, request.params.id, userId, source.equipment_id]
    );

    return response.json({ ticket: { ...result.rows[0], assigned_to_name: assignedUser.rows[0].name, service_order: order.rows[0] } });
  } catch (error) {
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Usuário atendente não encontrado.' });
    }

    console.error('Falha ao assumir chamado:', error.message);
    return response.status(500).json({ message: 'Não foi possível assumir o chamado.' });
  }
});

router.post('/', async (request, response) => {
  const { ticketType, companySector, location, relatedProblem, observations, attachmentName, priority = 'Normal', createdBy, equipmentId } = request.body;
  const normalizedPriority = priorityMap[priority] ?? priority;
  const normalizedType = ticketType === 'equipment' ? 'equipment' : ticketType === 'service' ? 'service' : '';

  if (!normalizedType || !companySector?.trim() || !location?.trim() || !relatedProblem?.trim() || !observations?.trim() || !createdBy) {
    return response.status(400).json({ message: 'Tipo, empresa/setor, localização, problema e observações são obrigatórios.' });
  }

  if (normalizedType === 'equipment' && !equipmentId) {
    return response.status(400).json({ message: 'Selecione um equipamento para o chamado.' });
  }

  if (!['normal', 'high', 'urgent'].includes(normalizedPriority)) {
    return response.status(400).json({ message: 'Prioridade inválida.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO support_tickets (title, requester, description, ticket_type, company_sector, location, related_problem, observations, attachment_name, priority, created_by, equipment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, ticket_number, service_order_number, title, requester, ticket_type, company_sector, location, related_problem, observations, attachment_name, priority, status, created_at, equipment_id`,
      [relatedProblem.trim(), companySector.trim(), observations.trim(), normalizedType, companySector.trim(), location.trim(), relatedProblem.trim(), observations.trim(), attachmentName?.trim() || null, normalizedPriority, createdBy, equipmentId || null]
    );
    const ticket = result.rows[0];

    return response.status(201).json({
      ticket: { ...ticket, protocol: `OS-${String(ticket.service_order_number).padStart(5, '0')}` }
    });
  } catch (error) {
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Usuário criador não encontrado.' });
    }

    console.error('Falha ao criar chamado:', error.message);
    return response.status(500).json({ message: 'Não foi possível criar o chamado.' });
  }
});

export default router;
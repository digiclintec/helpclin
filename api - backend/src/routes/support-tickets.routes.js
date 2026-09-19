import { Router } from 'express';

import pool from '../database.js';

const router = Router();
const priorityMap = { 'Pouco urgente': 'low', Baixa: 'low', low: 'low', Normal: 'normal', normal: 'normal', Alta: 'high', high: 'high', Urgente: 'urgent', urgent: 'urgent' };

router.get('/', async (_request, response) => {
  try {
    // Sincronizar em lote quaisquer chamados já aceitos cujo service_order_number divirja do order_number da OS vinculada
    await pool.query(
      `UPDATE support_tickets st
       SET service_order_number = so.order_number
       FROM service_orders so
       WHERE so.support_ticket_id = st.id
         AND (st.assigned_to IS NOT NULL OR st.status NOT IN ('open', 'cancelled'))
         AND st.service_order_number IS DISTINCT FROM so.order_number`
    ).catch((syncErr) => console.warn('Aviso na sincronização de OS em chamados:', syncErr.message));

    const result = await pool.query(
      `SELECT st.id, st.ticket_number,
              CASE
                WHEN (st.assigned_to IS NOT NULL OR st.status NOT IN ('open', 'cancelled')) THEN COALESCE(st.service_order_number, so.order_number)
                ELSE NULL
              END AS service_order_number,
              so.order_number,
              st.title, st.requester, st.ticket_type, st.company_sector, st.location, st.related_problem, st.observations, st.attachment_name, st.priority, st.status, st.created_by, st.created_at, st.assigned_to, assigned.name AS assigned_to_name, st.equipment_id, eq.name AS equipment_name,
              so.id AS service_order_id, so.service_performed_description, so.service_requested_description, so.status AS service_order_status, so.completed_at AS service_order_completed_at, so.billed_at AS service_order_billed_at, so.payment_informed_at AS service_order_payment_informed_at, so.payment_rejection_reason AS service_order_payment_rejection_reason, so.updated_at AS service_order_updated_at
       FROM support_tickets st
       LEFT JOIN users assigned ON assigned.id = st.assigned_to
       LEFT JOIN inventory_equipments eq ON eq.id = st.equipment_id
       LEFT JOIN service_orders so ON so.support_ticket_id = st.id
       ORDER BY st.created_at DESC`
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

    const ticketDetails = await pool.query('SELECT id, ticket_number, service_order_number, title, requester, description, ticket_type, company_sector, location, related_problem, observations, priority, created_by, equipment_id FROM support_tickets WHERE id = $1', [request.params.id]);
    if (ticketDetails.rowCount === 0) {
      return response.status(404).json({ message: 'Chamado não encontrado.' });
    }
    const source = ticketDetails.rows[0];

    // Busca ou cria a ordem de serviço vinculada e atualiza para in_progress com o técnico
    const order = await pool.query(
      `INSERT INTO service_orders (order_number, patient_name, service_type, priority, description, service_requested_description, status, created_by, support_ticket_id, technician_id, equipment_id)
       VALUES (nextval('service_orders_order_number_seq'::regclass), $1, $2, $3, $4, $4, 'in_progress', $5, $6, $7, $8)
       ON CONFLICT (support_ticket_id) DO UPDATE
       SET technician_id = EXCLUDED.technician_id,
           status = 'in_progress',
           updated_at = NOW(),
           equipment_id = COALESCE(EXCLUDED.equipment_id, service_orders.equipment_id)
       RETURNING id, order_number, patient_name, service_type, priority, description, status, technician_id, equipment_id`,
      [source.requester, source.title, source.priority, source.observations, source.created_by, request.params.id, userId, source.equipment_id]
    );

    const activeOrderNumber = order.rows[0].order_number;

    // Atualiza o chamado marcando como aceito (in_progress), atribuído ao técnico E SINCRONIZA O NÚMERO DA OS
    const result = await pool.query(
      `UPDATE support_tickets AS ticket
       SET assigned_to = $1,
           status = 'in_progress',
           service_order_number = $2,
           updated_at = NOW()
       WHERE ticket.id = $3 AND ticket.status NOT IN ('resolved', 'cancelled')
       RETURNING ticket.id, ticket.service_order_number, ticket.status, ticket.assigned_to`,
      [userId, activeOrderNumber, request.params.id]
    );

    if (result.rowCount === 0) {
      return response.status(409).json({ message: 'Chamado não disponível para atendimento.' });
    }

    return response.json({
      ticket: {
        ...result.rows[0],
        service_order_number: activeOrderNumber,
        order_number: activeOrderNumber,
        service_order_id: order.rows[0].id,
        assigned_to_name: assignedUser.rows[0].name,
        service_order: order.rows[0],
        protocol: `OS-${String(activeOrderNumber).padStart(5, '0')}`
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Usuário atendente não encontrado.' });
    }

    console.error('Falha ao assumir chamado:', error.message);
    return response.status(500).json({ message: 'Não foi possível assumir o chamado.' });
  }
});

router.post('/:id/reject', async (request, response) => {
  const { reason } = request.body;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rejectNote = reason ? ` [Atendimento recusado: ${reason.trim()}]` : ' [Atendimento recusado pelo técnico]';

      const ticketRes = await client.query(
        `UPDATE support_tickets
         SET status = 'cancelled',
             assigned_to = NULL,
             observations = CASE
               WHEN observations IS NULL OR observations = '' THEN $1
               ELSE observations || $1
             END,
             updated_at = NOW()
         WHERE id = $2 AND status NOT IN ('resolved', 'cancelled')
         RETURNING id, ticket_number, service_order_number, status`,
        [rejectNote, request.params.id]
      );

      if (ticketRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return response.status(409).json({ message: 'Chamado não disponível para recusa.' });
      }

      // Atualiza ou cancela a ordem de serviço vinculada
      await client.query(
        `UPDATE service_orders
         SET status = 'cancelled',
             updated_at = NOW()
         WHERE support_ticket_id = $1 OR order_number = $2`,
        [request.params.id, ticketRes.rows[0].service_order_number]
      );

      await client.query('COMMIT');
      return response.json({ message: 'Chamado recusado com sucesso.', ticket: ticketRes.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Falha ao recusar chamado:', error.message);
    return response.status(500).json({ message: 'Não foi possível recusar o chamado.' });
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

  if (!['low', 'normal', 'high', 'urgent'].includes(normalizedPriority)) {
    return response.status(400).json({ message: 'Prioridade inválida.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Inserir a solicitação formal de chamado técnico SEM número de OS ainda (só recebe após o técnico aceitar)
    const result = await client.query(
      `INSERT INTO support_tickets (title, requester, description, ticket_type, company_sector, location, related_problem, observations, attachment_name, priority, created_by, equipment_id, service_order_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULL)
       RETURNING id, ticket_number, service_order_number, title, requester, ticket_type, company_sector, location, related_problem, observations, attachment_name, priority, status, created_at, equipment_id`,
      [relatedProblem.trim(), companySector.trim(), observations.trim(), normalizedType, companySector.trim(), location.trim(), relatedProblem.trim(), observations.trim(), attachmentName?.trim() || null, normalizedPriority, createdBy, equipmentId || null]
    );
    const ticket = result.rows[0];

    // 2. Gerar a Ordem de Serviço em aberto (aguardando aceite técnico)
    const serviceTypeDesc = normalizedType === 'equipment' ? 'Manutenção de Equipamento' : 'Suporte / Atendimento a Sistemas';
    const orderResult = await client.query(
      `INSERT INTO service_orders (patient_name, service_type, priority, description, service_requested_description, status, created_by, support_ticket_id, equipment_id)
       VALUES ($1, $2, $3, $4, $4, 'open', $5, $6, $7)
       RETURNING id, order_number, patient_name, service_type, priority, description, status, created_at, equipment_id`,
      [companySector.trim(), serviceTypeDesc, normalizedPriority, observations.trim(), createdBy, ticket.id, equipmentId || null]
    );
    const order = orderResult.rows[0];

    // Note: o chamado NÃO recebe o número da OS aqui. Fica nulo até ser aceito pelo técnico!
    await client.query('COMMIT');

    return response.status(201).json({
      ticket: {
        ...ticket,
        service_order_id: order.id,
        service_order_number: null,
        order_number: null,
        protocol: 'Aguardando aceite'
      },
      order
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Usuário criador não encontrado.' });
    }

    console.error('Falha ao criar chamado e gerar ordem:', error.message);
    return response.status(500).json({ message: 'Não foi possível criar o chamado.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticketRes = await client.query('SELECT id, ticket_number, service_order_number FROM support_tickets WHERE id = $1', [request.params.id]);
      if (!ticketRes.rowCount) {
        await client.query('ROLLBACK');
        return response.status(404).json({ message: 'Chamado não encontrado.' });
      }

      const ticket = ticketRes.rows[0];

      // Exclui a ordem de serviço vinculada se houver (para não deixar órfãos)
      await client.query('DELETE FROM service_orders WHERE support_ticket_id = $1', [request.params.id]);

      // Exclui o chamado
      await client.query('DELETE FROM support_tickets WHERE id = $1', [request.params.id]);

      await client.query('COMMIT');
      const ticketRef = ticket.service_order_number ? `OS-${String(ticket.service_order_number).padStart(5, '0')}` : `#${String(ticket.ticket_number || ticket.id).padStart(5, '0')}`;
      return response.json({ message: `Chamado ${ticketRef} excluído com sucesso.` });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Falha ao excluir chamado:', error.message);
    return response.status(500).json({ message: 'Não foi possível excluir o chamado.' });
  }
});

export default router;
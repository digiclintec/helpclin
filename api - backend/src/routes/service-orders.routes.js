import { Router } from 'express';

import pool from '../database.js';

const router = Router();
const priorityMap = { 'Pouco urgente': 'low', Baixa: 'low', low: 'low', Normal: 'normal', normal: 'normal', Alta: 'high', high: 'high', Urgente: 'urgent', urgent: 'urgent' };

router.get('/', async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT orders.id, orders.order_number, orders.patient_name, orders.service_type, orders.priority, orders.due_date, orders.description, orders.service_requested_description, orders.service_performed_description, orders.status, orders.completed_at, orders.billed_at, orders.payment_informed_at, orders.payment_rejection_reason, orders.created_at, orders.updated_at, orders.technician_id, technician.name AS technician_name, orders.equipment_id, eq.name AS equipment_name
       FROM service_orders orders LEFT JOIN users technician ON technician.id = orders.technician_id LEFT JOIN inventory_equipments eq ON eq.id = orders.equipment_id ORDER BY orders.created_at DESC`
    );
    return response.json({ orders: result.rows });
  } catch (error) {
    console.error('Falha ao listar ordens de serviço:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar as ordens de serviço.' });
  }
});

router.patch('/:id', async (request, response) => {
  const { serviceType, priority, dueDate, requestedDescription, performedDescription, status, technicianId, billedAt, paymentDate, paymentInformedAt, rejectionReason } = request.body;
  const validStatuses = ['open', 'in_progress', 'completed', 'billing_pending', 'payment_informed', 'billed', 'cancelled'];

  if (status !== undefined && !validStatuses.includes(status)) {
    return response.status(400).json({ message: 'Estado inválido.' });
  }

  const normalizedPriority = priority ? (priorityMap[priority] ?? priority) : undefined;
  if (priority !== undefined && (!normalizedPriority || !['low', 'normal', 'high', 'urgent'].includes(normalizedPriority))) {
    return response.status(400).json({ message: 'Prioridade inválida.' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const effectiveDate = billedAt || paymentDate || paymentInformedAt || null;
      const result = await client.query(
        `UPDATE service_orders
         SET service_type = COALESCE($1, service_type),
             priority = COALESCE($2, priority),
             due_date = CASE WHEN $3::timestamptz IS NOT NULL THEN $3::timestamptz ELSE due_date END,
             description = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE description END,
             service_requested_description = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE service_requested_description END,
             service_performed_description = CASE WHEN $5::text IS NOT NULL THEN $5::text ELSE service_performed_description END,
             status = COALESCE($6, status),
             technician_id = CASE WHEN $7::uuid IS NOT NULL THEN $7::uuid ELSE technician_id END,
             completed_at = CASE
               WHEN COALESCE($6, status) IN ('completed', 'billing_pending', 'payment_informed', 'billed') AND completed_at IS NULL THEN NOW()
               WHEN COALESCE($6, status) NOT IN ('completed', 'billing_pending', 'payment_informed', 'billed') THEN NULL
               ELSE completed_at
             END,
             payment_informed_at = CASE
               WHEN COALESCE($6, status) = 'payment_informed' THEN COALESCE($8::timestamptz, payment_informed_at, NOW())
               WHEN COALESCE($6, status) = 'billing_pending' THEN NULL
               ELSE payment_informed_at
             END,
             billed_at = CASE
               WHEN COALESCE($6, status) = 'billed' THEN COALESCE($8::timestamptz, payment_informed_at, billed_at, NOW())
               WHEN COALESCE($6, status) <> 'billed' THEN NULL
               ELSE billed_at
             END,
             payment_rejection_reason = CASE
               WHEN COALESCE($6, status) = 'billing_pending' AND $9::text IS NOT NULL THEN $9::text
               WHEN COALESCE($6, status) = 'billed' THEN NULL
               ELSE payment_rejection_reason
             END,
             updated_at = NOW()
         WHERE id = $10
         RETURNING id, order_number, patient_name, service_type, priority, due_date, description, service_requested_description, service_performed_description, status, completed_at, billed_at, payment_informed_at, payment_rejection_reason, technician_id, support_ticket_id, equipment_id`,
        [
          serviceType?.trim() || null,
          normalizedPriority || null,
          dueDate || null,
          requestedDescription !== undefined ? (requestedDescription?.trim() || null) : null,
          performedDescription !== undefined ? (performedDescription?.trim() || null) : null,
          status || null,
          technicianId || null,
          effectiveDate,
          rejectionReason || null,
          request.params.id
        ]
      );
      if (!result.rowCount) {
        await client.query('ROLLBACK');
        return response.status(404).json({ message: 'Ordem de serviço não encontrada.' });
      }

      if (status) {
        const ticketStatus = {
          open: 'open',
          in_progress: 'in_progress',
          completed: 'resolved',
          billing_pending: 'resolved',
          payment_informed: 'resolved',
          billed: 'resolved',
          cancelled: 'cancelled'
        }[status];

        if (requestedDescription !== undefined && requestedDescription?.trim()) {
          await client.query(
            `UPDATE support_tickets
             SET status = $1,
                 observations = $2,
                 description = $2,
                 updated_at = NOW()
             WHERE id = (SELECT support_ticket_id FROM service_orders WHERE id = $3)`,
            [ticketStatus, requestedDescription.trim(), request.params.id]
          );
        } else {
          await client.query(
            `UPDATE support_tickets
             SET status = $1,
                 updated_at = NOW()
             WHERE id = (SELECT support_ticket_id FROM service_orders WHERE id = $2)`,
            [ticketStatus, request.params.id]
          );
        }
      }
      await client.query('COMMIT');

      const fullOrder = await pool.query(
        `SELECT orders.id, orders.order_number, orders.patient_name, orders.service_type, orders.priority, orders.due_date, orders.description, orders.service_requested_description, orders.service_performed_description, orders.status, orders.completed_at, orders.billed_at, orders.payment_informed_at, orders.payment_rejection_reason, orders.created_at, orders.updated_at, orders.technician_id, technician.name AS technician_name, orders.equipment_id, eq.name AS equipment_name
         FROM service_orders orders
         LEFT JOIN users technician ON technician.id = orders.technician_id
         LEFT JOIN inventory_equipments eq ON eq.id = orders.equipment_id
         WHERE orders.id = $1`,
        [request.params.id]
      );

      return response.json({ order: fullOrder.rows[0] || result.rows[0] });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Falha ao editar ordem de serviço:', error.message);
    return response.status(500).json({ message: 'Não foi possível editar a ordem de serviço.' });
  }
});

router.post('/:id/inform-payment', async (request, response) => {
  const { paymentDate } = request.body;
  const paymentDateIso = paymentDate
    ? new Date(paymentDate + (paymentDate.includes('T') ? '' : 'T12:00:00Z')).toISOString()
    : new Date().toISOString();
  try {
    const result = await pool.query(
      `UPDATE service_orders
       SET status = 'payment_informed',
           payment_informed_at = $1::timestamptz,
           billed_at = NULL,
           payment_rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, order_number, status, payment_informed_at, billed_at`,
      [paymentDateIso, request.params.id]
    );
    if (!result.rowCount) return response.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    return response.json({ order: result.rows[0], message: 'Pagamento informado com sucesso. Aguardando confirmação do técnico.' });
  } catch (error) {
    console.error('Falha ao informar pagamento:', error.message);
    return response.status(500).json({ message: 'Não foi possível informar o pagamento.' });
  }
});

router.post('/:id/confirm-receipt', async (request, response) => {
  const { technicianId } = request.body;
  try {
    const current = await pool.query('SELECT payment_informed_at FROM service_orders WHERE id = $1', [request.params.id]);
    const informedAt = current.rows[0]?.payment_informed_at || new Date().toISOString();

    const result = await pool.query(
      `UPDATE service_orders
       SET status = 'billed',
           billed_at = COALESCE(payment_informed_at, $1::timestamptz, NOW()),
           technician_id = COALESCE($2, technician_id),
           payment_rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, order_number, status, payment_informed_at, billed_at, technician_id`,
      [informedAt, technicianId || null, request.params.id]
    );
    if (!result.rowCount) return response.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    return response.json({ order: result.rows[0], message: 'Recebimento confirmado pelo técnico com sucesso! Ordem faturada.' });
  } catch (error) {
    console.error('Falha ao confirmar recebimento:', error.message);
    return response.status(500).json({ message: 'Não foi possível confirmar o recebimento.' });
  }
});

router.post('/:id/reject-receipt', async (request, response) => {
  const { technicianId, reason } = request.body;
  try {
    const result = await pool.query(
      `UPDATE service_orders
       SET status = 'billing_pending',
           billed_at = NULL,
           payment_informed_at = NULL,
           payment_rejection_reason = $1,
           technician_id = COALESCE($2, technician_id),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, order_number, status, payment_informed_at, billed_at, payment_rejection_reason`,
      [reason || 'Pagamento não identificado pelo técnico', technicianId || null, request.params.id]
    );
    if (!result.rowCount) return response.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    return response.json({ order: result.rows[0], message: 'Pagamento não recebido. A ordem retornou para pendente de pagamento.' });
  } catch (error) {
    console.error('Falha ao recusar recebimento:', error.message);
    return response.status(500).json({ message: 'Não foi possível recusar o pagamento.' });
  }
});

router.post('/', async (request, response) => {
  const { patientName, serviceType, priority = 'Normal', dueDate, description, createdBy } = request.body;
  const normalizedPriority = priorityMap[priority] ?? priority;

  if (!patientName?.trim() || !serviceType?.trim() || !description?.trim() || !createdBy) {
    return response.status(400).json({ message: 'Paciente, serviço, descrição e usuário são obrigatórios.' });
  }

  if (!['normal', 'high', 'urgent'].includes(normalizedPriority)) {
    return response.status(400).json({ message: 'Prioridade inválida.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO service_orders (patient_name, service_type, priority, due_date, description, service_requested_description, created_by)
       VALUES ($1, $2, $3, $4, $5, $5, $6)
       RETURNING id, order_number, patient_name, service_type, priority, due_date, description, service_requested_description, status, created_at`,
      [patientName.trim(), serviceType.trim(), normalizedPriority, dueDate || null, description.trim(), createdBy]
    );

    return response.status(201).json({ order: result.rows[0] });
  } catch (error) {
    if (error.code === '23503') {
      return response.status(400).json({ message: 'Usuário criador não encontrado.' });
    }
    console.error('Falha ao criar ordem:', error.message);
    return response.status(500).json({ message: 'Não foi possível cadastrar a ordem de serviço.' });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderRes = await client.query('SELECT id, order_number, support_ticket_id FROM service_orders WHERE id = $1', [request.params.id]);
      if (!orderRes.rowCount) {
        await client.query('ROLLBACK');
        return response.status(404).json({ message: 'Ordem de serviço não encontrada.' });
      }

      const order = orderRes.rows[0];
      const supportTicketId = order.support_ticket_id;
      const shouldDeleteTicket = request.query.deleteTicket === 'true';

      // 1. Excluir a ordem de serviço primeiro (evita restrições de chave estrangeira)
      await client.query('DELETE FROM service_orders WHERE id = $1', [request.params.id]);

      // 2. Se houver chamado vinculado, atualizar ou excluir conforme solicitado
      if (supportTicketId) {
        if (shouldDeleteTicket) {
          await client.query('DELETE FROM support_tickets WHERE id = $1', [supportTicketId]);
        } else {
          const orderNumStr = order.order_number != null ? String(order.order_number).padStart(5, '0') : '';
          const cancelNote = orderNumStr ? ` [Ordem de serviço OS-${orderNumStr} excluída]` : ' [Ordem de serviço excluída]';

          await client.query(
            `UPDATE support_tickets
             SET status = 'cancelled',
                 assigned_to = NULL,
                 observations = CASE
                   WHEN observations IS NULL OR observations = '' THEN $1
                   ELSE observations || $1
                 END,
                 updated_at = NOW()
             WHERE id = $2`,
            [cancelNote, supportTicketId]
          );
        }
      }

      await client.query('COMMIT');
      return response.json({ message: `Ordem de serviço OS-${String(order.order_number).padStart(5, '0')} excluída com sucesso.` });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Falha ao excluir ordem de serviço:', error.message);
    return response.status(500).json({ message: 'Não foi possível excluir a ordem de serviço.' });
  }
});

export default router;

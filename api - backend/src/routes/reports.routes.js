import { Router } from 'express';

import pool from '../database.js';

const router = Router();

router.get('/summary', async (_request, response) => {
  try {
    const [orders, tickets, weekly] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'open')::int AS open, COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress, COUNT(*) FILTER (WHERE status = 'completed')::int AS completed, COUNT(*) FILTER (WHERE status = 'billing_pending')::int AS billing_pending, COUNT(*) FILTER (WHERE status = 'payment_informed')::int AS payment_informed, COUNT(*) FILTER (WHERE status = 'billed')::int AS billed FROM service_orders`),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'open')::int AS open, COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress, COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved FROM support_tickets`),
      pool.query(`SELECT TO_CHAR(week, 'DD/MM') AS week, COALESCE(orders.total, 0)::int AS orders, COALESCE(tickets.total, 0)::int AS tickets
        FROM generate_series(date_trunc('week', NOW()) - INTERVAL '4 weeks', date_trunc('week', NOW()), INTERVAL '1 week') AS week
        LEFT JOIN (SELECT date_trunc('week', created_at) AS week, COUNT(*) AS total FROM service_orders GROUP BY 1) orders USING (week)
        LEFT JOIN (SELECT date_trunc('week', created_at) AS week, COUNT(*) AS total FROM support_tickets GROUP BY 1) tickets USING (week)
        ORDER BY week`)
    ]);

    return response.json({ orders: orders.rows[0], tickets: tickets.rows[0], weekly: weekly.rows });
  } catch (error) {
    console.error('Falha ao gerar relatório:', error.message);
    return response.status(500).json({ message: 'Não foi possível carregar os relatórios.' });
  }
});

export default router;
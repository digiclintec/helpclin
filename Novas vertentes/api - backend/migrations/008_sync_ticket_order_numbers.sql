UPDATE service_orders AS orders
SET order_number = tickets.ticket_number
FROM support_tickets AS tickets
WHERE orders.support_ticket_id = tickets.id
  AND orders.order_number <> tickets.ticket_number;
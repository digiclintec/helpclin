ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS support_ticket_id UUID REFERENCES support_tickets(id),
  ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES users(id);

CREATE UNIQUE INDEX IF NOT EXISTS service_orders_support_ticket_idx
  ON service_orders (support_ticket_id)
  WHERE support_ticket_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_orders_support_ticket_full_idx
  ON service_orders (support_ticket_id);

CREATE INDEX IF NOT EXISTS service_orders_technician_idx ON service_orders (technician_id);
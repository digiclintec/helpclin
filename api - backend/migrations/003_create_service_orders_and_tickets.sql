CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGSERIAL NOT NULL UNIQUE,
  patient_name VARCHAR(160) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  due_date DATE,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_orders_priority_check CHECK (priority IN ('normal', 'high', 'urgent')),
  CONSTRAINT service_orders_status_check CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS service_orders_status_idx ON service_orders (status);
CREATE INDEX IF NOT EXISTS service_orders_created_by_idx ON service_orders (created_by);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number BIGSERIAL NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_tickets_priority_check CHECK (priority IN ('normal', 'high', 'urgent')),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_by_idx ON support_tickets (created_by);
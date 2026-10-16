-- Migration 013: Separate technician and client roles, and support payment confirmation workflow

-- 1. Support 'client' and 'technician' roles in users table
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'technician', 'client', 'manager', 'staff', 'user'));

-- 2. Add columns for payment confirmation workflow in service_orders
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS payment_informed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- 3. Support 'payment_informed' status in service_orders
ALTER TABLE service_orders
  DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE service_orders
  ADD CONSTRAINT service_orders_status_check
  CHECK (status IN ('open', 'in_progress', 'completed', 'billing_pending', 'payment_informed', 'billed', 'cancelled'));

CREATE INDEX IF NOT EXISTS service_orders_payment_informed_at_idx ON service_orders (payment_informed_at);

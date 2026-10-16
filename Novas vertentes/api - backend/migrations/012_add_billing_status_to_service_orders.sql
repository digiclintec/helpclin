ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ;

UPDATE service_orders
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;

ALTER TABLE service_orders
  DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE service_orders
  ADD CONSTRAINT service_orders_status_check
  CHECK (status IN ('open', 'in_progress', 'completed', 'billing_pending', 'billed', 'cancelled'));

CREATE INDEX IF NOT EXISTS service_orders_completed_at_idx ON service_orders (completed_at);
CREATE INDEX IF NOT EXISTS service_orders_billed_at_idx ON service_orders (billed_at);

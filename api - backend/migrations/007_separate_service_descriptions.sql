ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS service_requested_description TEXT,
  ADD COLUMN IF NOT EXISTS service_performed_description TEXT;

UPDATE service_orders
SET service_requested_description = COALESCE(service_requested_description, description)
WHERE service_requested_description IS NULL;

ALTER TABLE service_orders
  ALTER COLUMN service_requested_description SET NOT NULL;
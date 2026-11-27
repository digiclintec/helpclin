ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS service_value NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS visit_fee NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_value NUMERIC(12,2) DEFAULT 0.00;

UPDATE service_orders
SET total_value = COALESCE(service_value, 0) + COALESCE(visit_fee, 0)
WHERE total_value IS NULL OR total_value = 0;

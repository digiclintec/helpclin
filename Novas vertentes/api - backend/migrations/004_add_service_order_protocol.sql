CREATE SEQUENCE IF NOT EXISTS support_tickets_service_order_protocol_seq;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS service_order_number BIGINT,
  ADD COLUMN IF NOT EXISTS requester VARCHAR(160);

UPDATE support_tickets
SET requester = 'Não informado'
WHERE requester IS NULL;

ALTER TABLE support_tickets
  ALTER COLUMN requester SET NOT NULL;

UPDATE support_tickets
SET service_order_number = nextval('support_tickets_service_order_protocol_seq')
WHERE service_order_number IS NULL;

ALTER TABLE support_tickets
  ALTER COLUMN service_order_number SET DEFAULT nextval('support_tickets_service_order_protocol_seq'),
  ALTER COLUMN service_order_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_service_order_number_idx
  ON support_tickets (service_order_number);
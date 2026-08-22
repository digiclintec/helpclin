ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS company_sector VARCHAR(160),
  ADD COLUMN IF NOT EXISTS location VARCHAR(160),
  ADD COLUMN IF NOT EXISTS related_problem VARCHAR(160),
  ADD COLUMN IF NOT EXISTS observations TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

UPDATE support_tickets
SET ticket_type = COALESCE(ticket_type, 'service'),
    company_sector = COALESCE(company_sector, requester),
    location = COALESCE(location, 'Não informado'),
    related_problem = COALESCE(related_problem, title),
    observations = COALESCE(observations, description)
WHERE ticket_type IS NULL
   OR company_sector IS NULL
   OR location IS NULL
   OR related_problem IS NULL
   OR observations IS NULL;

ALTER TABLE support_tickets
  ALTER COLUMN ticket_type SET NOT NULL,
  ALTER COLUMN company_sector SET NOT NULL,
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN related_problem SET NOT NULL,
  ALTER COLUMN observations SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_type_check'
  ) THEN
    ALTER TABLE support_tickets
      ADD CONSTRAINT support_tickets_type_check CHECK (ticket_type IN ('equipment', 'service'));
  END IF;
END $$;
ALTER TABLE support_tickets 
ADD COLUMN equipment_id UUID REFERENCES inventory_equipments(id) ON DELETE SET NULL;

ALTER TABLE service_orders 
ADD COLUMN equipment_id UUID REFERENCES inventory_equipments(id) ON DELETE SET NULL;

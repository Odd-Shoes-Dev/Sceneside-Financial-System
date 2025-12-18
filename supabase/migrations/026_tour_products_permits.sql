-- =====================================================
-- MIGRATION 026: TOUR PRODUCTS & PERMITS
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Tour scheduling, capacity management, and permits tracking
-- =====================================================

-- =====================================================
-- PART A: TOUR SCHEDULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tour_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Schedule Details
  schedule_name VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Capacity
  total_capacity INTEGER NOT NULL,
  booked_capacity INTEGER DEFAULT 0,
  available_capacity INTEGER GENERATED ALWAYS AS (total_capacity - booked_capacity) STORED,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  
  -- Status
  status tour_schedule_status DEFAULT 'draft',
  
  -- Pricing (can override product price)
  price_override DECIMAL(15,2),
  early_bird_price DECIMAL(15,2),
  early_bird_deadline DATE,
  group_discount_percent DECIMAL(5,2),
  group_min_size INTEGER,
  
  -- Assignments
  guide_id UUID,
  guide_name VARCHAR(255),
  vehicle_id UUID REFERENCES fixed_assets(id),
  vehicle_name VARCHAR(255),
  
  -- Permits required
  permit_ids UUID[],
  permits_confirmed BOOLEAN DEFAULT false,
  
  -- Meeting point
  meeting_point TEXT,
  meeting_time TIME,
  pickup_available BOOLEAN DEFAULT false,
  pickup_locations TEXT[],
  
  -- Notes
  internal_notes TEXT,
  customer_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT valid_schedule_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_capacity CHECK (total_capacity > 0),
  CONSTRAINT valid_booked CHECK (booked_capacity >= 0 AND booked_capacity <= total_capacity)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tour_schedules_product ON tour_schedules(product_id);
CREATE INDEX IF NOT EXISTS idx_tour_schedules_dates ON tour_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tour_schedules_status ON tour_schedules(status);
CREATE INDEX IF NOT EXISTS idx_tour_schedules_available ON tour_schedules(product_id, start_date) 
  WHERE status = 'open' AND available_capacity > 0;
CREATE INDEX IF NOT EXISTS idx_tour_schedules_guide ON tour_schedules(guide_id) WHERE guide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tour_schedules_vehicle ON tour_schedules(vehicle_id) WHERE vehicle_id IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tour_schedules_updated_at ON tour_schedules;
CREATE TRIGGER update_tour_schedules_updated_at
  BEFORE UPDATE ON tour_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tour_schedules IS 'Scheduled tour departures with capacity management';

-- =====================================================
-- PART B: TOUR BOOKINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tour_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES tour_schedules(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Booking Details
  booking_number VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  booking_status VARCHAR(50) DEFAULT 'pending',
  -- Values: 'pending', 'confirmed', 'paid', 'cancelled', 'completed', 'no_show'
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Participants
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  num_infants INTEGER DEFAULT 0,
  total_participants INTEGER GENERATED ALWAYS AS (num_adults + num_children + num_infants) STORED,
  participant_details JSONB DEFAULT '[]',
  -- Example: [{"name": "John", "age": 35, "passport": "ABC123", "dietary": "vegetarian"}]
  
  -- Special Requirements
  special_requests TEXT,
  dietary_requirements TEXT[],
  accessibility_needs TEXT,
  
  -- Pickup
  pickup_required BOOLEAN DEFAULT false,
  pickup_location TEXT,
  pickup_time TIME,
  
  -- Pricing
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  
  -- Payment
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  -- Values: 'unpaid', 'partial', 'paid', 'refunded'
  
  -- Invoice link
  invoice_id UUID REFERENCES invoices(id),
  
  -- Permits allocated
  permits_allocated JSONB DEFAULT '[]',
  -- Example: [{"permit_id": "uuid", "permit_number": "GP-001", "quantity": 2}]
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount DECIMAL(15,2),
  
  -- Notes
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT unique_booking_number UNIQUE(booking_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tour_bookings_schedule ON tour_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_product ON tour_bookings(product_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_customer ON tour_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_status ON tour_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_date ON tour_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_payment ON tour_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_number ON tour_bookings(booking_number);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tour_bookings_updated_at ON tour_bookings;
CREATE TRIGGER update_tour_bookings_updated_at
  BEFORE UPDATE ON tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tour_bookings IS 'Customer bookings for scheduled tours';

-- =====================================================
-- PART C: BOOKING NUMBER SEQUENCE
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS tour_booking_seq START 1001;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'BK-' || LPAD(nextval('tour_booking_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART D: TRIGGER TO UPDATE SCHEDULE CAPACITY
-- =====================================================

CREATE OR REPLACE FUNCTION update_schedule_booked_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_total_booked INTEGER;
BEGIN
  -- Recalculate total booked capacity for the schedule
  SELECT COALESCE(SUM(total_participants), 0)
  INTO v_total_booked
  FROM tour_bookings
  WHERE schedule_id = COALESCE(NEW.schedule_id, OLD.schedule_id)
    AND booking_status NOT IN ('cancelled', 'no_show');
  
  -- Update the schedule
  UPDATE tour_schedules
  SET booked_capacity = v_total_booked
  WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id);
  
  -- Update schedule status based on capacity
  UPDATE tour_schedules
  SET status = CASE
    WHEN v_total_booked >= total_capacity THEN 'sold_out'::tour_schedule_status
    WHEN v_total_booked >= (total_capacity * 0.8) THEN 'nearly_full'::tour_schedule_status
    WHEN status = 'draft' THEN 'draft'::tour_schedule_status
    ELSE 'open'::tour_schedule_status
  END
  WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id)
    AND status NOT IN ('in_progress', 'completed', 'cancelled');
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_capacity ON tour_bookings;
CREATE TRIGGER trigger_update_schedule_capacity
  AFTER INSERT OR UPDATE OR DELETE ON tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_booked_capacity();

-- =====================================================
-- PART E: PERMIT ALLOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS permit_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_product_id UUID NOT NULL REFERENCES products(id),
  
  -- Allocation Details
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  allocation_type VARCHAR(50) NOT NULL,
  -- Values: 'tour_booking', 'manual', 'reserved', 'returned'
  
  -- Quantities
  quantity INTEGER NOT NULL,
  
  -- Link to booking/tour
  tour_booking_id UUID REFERENCES tour_bookings(id),
  tour_schedule_id UUID REFERENCES tour_schedules(id),
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  
  -- Permit details
  permit_numbers TEXT[],
  valid_from DATE,
  valid_until DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'allocated',
  -- Values: 'allocated', 'used', 'returned', 'expired', 'cancelled'
  used_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_permit_allocations_permit ON permit_allocations(permit_product_id);
CREATE INDEX IF NOT EXISTS idx_permit_allocations_booking ON permit_allocations(tour_booking_id);
CREATE INDEX IF NOT EXISTS idx_permit_allocations_schedule ON permit_allocations(tour_schedule_id);
CREATE INDEX IF NOT EXISTS idx_permit_allocations_customer ON permit_allocations(customer_id);
CREATE INDEX IF NOT EXISTS idx_permit_allocations_status ON permit_allocations(status);
CREATE INDEX IF NOT EXISTS idx_permit_allocations_date ON permit_allocations(allocation_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_permit_allocations_updated_at ON permit_allocations;
CREATE TRIGGER update_permit_allocations_updated_at
  BEFORE UPDATE ON permit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE permit_allocations IS 'Track allocation of permits to bookings and customers';

-- =====================================================
-- PART F: TRIGGER TO UPDATE PERMIT USED QUOTA
-- =====================================================

CREATE OR REPLACE FUNCTION update_permit_used_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_total_allocated INTEGER;
BEGIN
  -- Calculate total allocated (excluding returned/cancelled)
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_total_allocated
  FROM permit_allocations
  WHERE permit_product_id = COALESCE(NEW.permit_product_id, OLD.permit_product_id)
    AND status IN ('allocated', 'used');
  
  -- Update the permit product
  UPDATE products
  SET permit_used_quota = v_total_allocated
  WHERE id = COALESCE(NEW.permit_product_id, OLD.permit_product_id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_permit_quota ON permit_allocations;
CREATE TRIGGER trigger_update_permit_quota
  AFTER INSERT OR UPDATE OR DELETE ON permit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_permit_used_quota();

-- =====================================================
-- PART G: EQUIPMENT ASSIGNMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Assignment Details
  assignment_type VARCHAR(50) NOT NULL,
  -- Values: 'tour', 'rental', 'maintenance', 'staff'
  
  -- Quantity (for items tracked by quantity)
  quantity INTEGER DEFAULT 1,
  
  -- Link to tour/schedule
  tour_schedule_id UUID REFERENCES tour_schedules(id),
  
  -- Or link to rental/customer
  customer_id UUID REFERENCES customers(id),
  rental_start_date DATE,
  rental_end_date DATE,
  
  -- Or link to staff member
  assigned_to_user_id UUID REFERENCES user_profiles(id),
  assigned_to_name VARCHAR(255),
  
  -- Condition tracking
  condition_on_checkout item_condition,
  condition_on_return item_condition,
  
  -- Status
  status VARCHAR(50) DEFAULT 'assigned',
  -- Values: 'assigned', 'in_use', 'returned', 'damaged', 'lost'
  
  checked_out_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES user_profiles(id),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES user_profiles(id),
  
  -- Expected return
  expected_return_date DATE,
  
  -- Notes
  checkout_notes TEXT,
  checkin_notes TEXT,
  damage_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_product ON equipment_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_schedule ON equipment_assignments(tour_schedule_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_customer ON equipment_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_user ON equipment_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_status ON equipment_assignments(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_active ON equipment_assignments(product_id) 
  WHERE status IN ('assigned', 'in_use');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_equipment_assignments_updated_at ON equipment_assignments;
CREATE TRIGGER update_equipment_assignments_updated_at
  BEFORE UPDATE ON equipment_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE equipment_assignments IS 'Track assignment of reusable equipment to tours, rentals, or staff';

-- =====================================================
-- PART H: MAINTENANCE RECORDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Or for fixed assets
  fixed_asset_id UUID REFERENCES fixed_assets(id),
  
  -- Maintenance Details
  maintenance_type VARCHAR(50) NOT NULL,
  -- Values: 'scheduled', 'repair', 'inspection', 'cleaning', 'replacement'
  
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date DATE,
  
  -- Description
  description TEXT NOT NULL,
  work_performed TEXT,
  
  -- Condition before/after
  condition_before item_condition,
  condition_after item_condition,
  
  -- Parts used
  parts_used JSONB DEFAULT '[]',
  -- Example: [{"product_id": "uuid", "quantity": 2, "cost": 50}]
  
  -- Costs
  labor_cost DECIMAL(15,2) DEFAULT 0,
  parts_cost DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
  
  -- External service
  external_vendor_id UUID REFERENCES vendors(id),
  external_reference VARCHAR(100),
  
  -- Next maintenance
  next_maintenance_date DATE,
  next_maintenance_type VARCHAR(50),
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled',
  -- Values: 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Bill/Expense link
  bill_id UUID REFERENCES bills(id),
  expense_id UUID REFERENCES expenses(id),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  performed_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_product ON maintenance_records(product_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset ON maintenance_records(fixed_asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_next ON maintenance_records(next_maintenance_date) 
  WHERE next_maintenance_date IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE maintenance_records IS 'Track maintenance history for equipment and assets';

-- =====================================================
-- PART I: UPDATE PRODUCT MAINTENANCE DATE AFTER MAINTENANCE
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_maintenance_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET 
      last_maintenance_date = NEW.completed_date,
      next_maintenance_date = NEW.next_maintenance_date,
      condition_status = COALESCE(NEW.condition_after, condition_status)
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_maintenance ON maintenance_records;
CREATE TRIGGER trigger_update_product_maintenance
  AFTER INSERT OR UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_product_maintenance_dates();

-- =====================================================
-- PART J: VIEWS FOR TOUR & PERMIT MANAGEMENT
-- =====================================================

-- Tour Schedule Summary View
CREATE OR REPLACE VIEW v_tour_schedule_summary AS
SELECT 
  ts.id,
  ts.product_id,
  p.name AS tour_name,
  ts.start_date,
  ts.end_date,
  ts.total_capacity,
  ts.booked_capacity,
  ts.available_capacity,
  ts.status,
  ts.guide_name,
  ts.vehicle_name,
  COALESCE(ts.price_override, p.unit_price) AS price,
  p.currency,
  COUNT(tb.id) AS total_bookings,
  SUM(CASE WHEN tb.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_bookings,
  SUM(COALESCE(tb.total_amount, 0)) AS total_revenue,
  SUM(COALESCE(tb.amount_paid, 0)) AS collected_revenue
FROM tour_schedules ts
JOIN products p ON ts.product_id = p.id
LEFT JOIN tour_bookings tb ON ts.id = tb.schedule_id AND tb.booking_status NOT IN ('cancelled')
GROUP BY ts.id, ts.product_id, p.name, ts.start_date, ts.end_date, 
         ts.total_capacity, ts.booked_capacity, ts.available_capacity,
         ts.status, ts.guide_name, ts.vehicle_name, ts.price_override, 
         p.unit_price, p.currency;

COMMENT ON VIEW v_tour_schedule_summary IS 'Summary of tour schedules with booking statistics';

-- Permit Status View
CREATE OR REPLACE VIEW v_permit_status AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.issuing_authority,
  p.permit_number,
  p.permit_expiry_date,
  p.permit_status,
  p.permit_quota,
  p.permit_used_quota,
  (p.permit_quota - p.permit_used_quota) AS available_quota,
  (p.permit_expiry_date - CURRENT_DATE) AS days_until_expiry,
  p.renewal_reminder_days,
  CASE 
    WHEN p.permit_expiry_date < CURRENT_DATE THEN 'expired'
    WHEN (p.permit_expiry_date - CURRENT_DATE) <= p.renewal_reminder_days THEN 'expiring_soon'
    ELSE 'active'
  END AS expiry_status,
  pc.name AS category_name
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.inventory_category = 'permit'
  AND p.is_active = true;

COMMENT ON VIEW v_permit_status IS 'Current status of all permits with quota and expiry tracking';

-- Equipment Status View
CREATE OR REPLACE VIEW v_equipment_status AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.condition_status,
  p.quantity_on_hand,
  p.currently_assigned_to,
  p.last_maintenance_date,
  p.next_maintenance_date,
  CASE 
    WHEN p.next_maintenance_date < CURRENT_DATE THEN 'overdue'
    WHEN p.next_maintenance_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'due_soon'
    ELSE 'ok'
  END AS maintenance_status,
  COUNT(ea.id) FILTER (WHERE ea.status IN ('assigned', 'in_use')) AS currently_assigned_count,
  pc.name AS category_name
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN equipment_assignments ea ON p.id = ea.product_id
WHERE p.inventory_category = 'physical_stock'
  AND p.stock_type = 'reusable'
  AND p.is_active = true
GROUP BY p.id, p.sku, p.name, p.condition_status, p.quantity_on_hand,
         p.currently_assigned_to, p.last_maintenance_date, p.next_maintenance_date, pc.name;

COMMENT ON VIEW v_equipment_status IS 'Status of reusable equipment with maintenance tracking';

-- =====================================================
-- MIGRATION 024: INVENTORY LOCATION MANAGEMENT
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Multi-location inventory tracking and stock transfers
-- =====================================================

-- =====================================================
-- PART A: INVENTORY LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  location_type location_type NOT NULL DEFAULT 'warehouse',
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Uganda',
  
  -- GPS Coordinates (for mobile locations like vehicles)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_mobile BOOLEAN DEFAULT false,
  
  -- Capacity (optional)
  total_capacity DECIMAL(15,2),
  capacity_unit VARCHAR(50) DEFAULT 'sqm',
  current_utilization DECIMAL(5,2) DEFAULT 0,
  
  -- Operating hours
  operating_hours JSONB DEFAULT '{}',
  -- Example: {"monday": {"open": "08:00", "close": "18:00"}, ...}
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT unique_location_code UNIQUE(code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_locations_type ON inventory_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_active ON inventory_locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inventory_locations_default ON inventory_locations(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_inventory_locations_mobile ON inventory_locations(is_mobile) WHERE is_mobile = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_inventory_locations_updated_at ON inventory_locations;
CREATE TRIGGER update_inventory_locations_updated_at
  BEFORE UPDATE ON inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE inventory_locations IS 'Physical locations where inventory is stored (warehouses, offices, vehicles)';

-- =====================================================
-- PART B: PRODUCT STOCK LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_stock_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  
  -- Stock Quantities
  quantity_on_hand DECIMAL(15,4) DEFAULT 0,
  quantity_reserved DECIMAL(15,4) DEFAULT 0,
  quantity_available DECIMAL(15,4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  
  -- Reorder Settings (location-specific, overrides product defaults)
  reorder_point DECIMAL(15,4),
  reorder_quantity DECIMAL(15,4),
  min_stock_level DECIMAL(15,4),
  max_stock_level DECIMAL(15,4),
  
  -- Bin/Shelf Location (within the location)
  bin_location VARCHAR(100),
  aisle VARCHAR(50),
  shelf VARCHAR(50),
  bin VARCHAR(50),
  
  -- Tracking
  last_counted_at TIMESTAMPTZ,
  last_restocked_at TIMESTAMPTZ,
  last_movement_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_product_location UNIQUE(product_id, location_id),
  CONSTRAINT check_quantity_non_negative CHECK (quantity_on_hand >= 0),
  CONSTRAINT check_reserved_non_negative CHECK (quantity_reserved >= 0),
  CONSTRAINT check_reserved_not_exceed CHECK (quantity_reserved <= quantity_on_hand)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_product ON product_stock_locations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_location ON product_stock_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_low_stock ON product_stock_locations(product_id, location_id) 
  WHERE quantity_on_hand <= reorder_point;
CREATE INDEX IF NOT EXISTS idx_product_stock_locations_has_stock ON product_stock_locations(location_id) 
  WHERE quantity_on_hand > 0;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_product_stock_locations_updated_at ON product_stock_locations;
CREATE TRIGGER update_product_stock_locations_updated_at
  BEFORE UPDATE ON product_stock_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE product_stock_locations IS 'Track inventory quantities at each location for multi-warehouse support';

-- =====================================================
-- PART C: STOCK TRANSFERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transfer Details
  transfer_number VARCHAR(50) NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status transfer_status NOT NULL DEFAULT 'draft',
  
  -- Locations
  from_location_id UUID NOT NULL REFERENCES inventory_locations(id),
  to_location_id UUID NOT NULL REFERENCES inventory_locations(id),
  
  -- Logistics
  requested_date DATE,
  shipped_date DATE,
  expected_delivery_date DATE,
  received_date DATE,
  
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  carrier VARCHAR(255),
  
  -- Responsibility
  requested_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  shipped_by UUID REFERENCES user_profiles(id),
  received_by UUID REFERENCES user_profiles(id),
  
  -- Totals
  total_items INTEGER DEFAULT 0,
  total_quantity DECIMAL(15,4) DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  
  -- Notes
  reason TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT unique_transfer_number UNIQUE(transfer_number),
  CONSTRAINT check_different_locations CHECK (from_location_id != to_location_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_location ON stock_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_location ON stock_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_date ON stock_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_pending ON stock_transfers(status) 
  WHERE status IN ('draft', 'pending', 'approved', 'in_transit');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_stock_transfers_updated_at ON stock_transfers;
CREATE TRIGGER update_stock_transfers_updated_at
  BEFORE UPDATE ON stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE stock_transfers IS 'Track stock movements between locations';

-- =====================================================
-- PART D: STOCK TRANSFER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  -- Quantities
  quantity_requested DECIMAL(15,4) NOT NULL,
  quantity_shipped DECIMAL(15,4) DEFAULT 0,
  quantity_received DECIMAL(15,4) DEFAULT 0,
  quantity_variance DECIMAL(15,4) GENERATED ALWAYS AS (quantity_shipped - quantity_received) STORED,
  
  -- Unit info
  unit_of_measure VARCHAR(50),
  unit_cost DECIMAL(15,4),
  line_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity_requested * COALESCE(unit_cost, 0)) STORED,
  
  -- Tracking
  batch_number VARCHAR(100),
  lot_number VARCHAR(100),
  serial_numbers TEXT[],
  expiry_date DATE,
  
  -- Condition (for reusable items)
  condition_on_send item_condition,
  condition_on_receive item_condition,
  
  -- Source bin/destination bin
  from_bin_location VARCHAR(100),
  to_bin_location VARCHAR(100),
  
  -- Notes
  notes TEXT,
  variance_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product ON stock_transfer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_variant ON stock_transfer_items(variant_id) WHERE variant_id IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_stock_transfer_items_updated_at ON stock_transfer_items;
CREATE TRIGGER update_stock_transfer_items_updated_at
  BEFORE UPDATE ON stock_transfer_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE stock_transfer_items IS 'Line items for each stock transfer';

-- =====================================================
-- PART E: TRANSFER NUMBER SEQUENCE
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1001;

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'TRF-' || LPAD(nextval('transfer_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART F: FUNCTIONS FOR TRANSFER OPERATIONS
-- =====================================================

-- Function to ship a transfer (deduct from source location)
CREATE OR REPLACE FUNCTION ship_stock_transfer(
  p_transfer_id UUID,
  p_shipped_by UUID,
  p_tracking_number VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM stock_transfers WHERE id = p_transfer_id;
  
  IF v_transfer IS NULL THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;
  
  IF v_transfer.status NOT IN ('draft', 'pending', 'approved') THEN
    RAISE EXCEPTION 'Transfer cannot be shipped from status: %', v_transfer.status;
  END IF;
  
  -- Process each item
  FOR v_item IN 
    SELECT * FROM stock_transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    -- Deduct from source location
    UPDATE product_stock_locations
    SET 
      quantity_on_hand = quantity_on_hand - v_item.quantity_requested,
      last_movement_at = NOW()
    WHERE product_id = v_item.product_id 
      AND location_id = v_transfer.from_location_id;
    
    -- Update shipped quantity
    UPDATE stock_transfer_items
    SET quantity_shipped = quantity_requested
    WHERE id = v_item.id;
  END LOOP;
  
  -- Update transfer status
  UPDATE stock_transfers
  SET 
    status = 'in_transit',
    shipped_date = CURRENT_DATE,
    shipped_by = p_shipped_by,
    tracking_number = COALESCE(p_tracking_number, tracking_number)
  WHERE id = p_transfer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to receive a transfer (add to destination location)
CREATE OR REPLACE FUNCTION receive_stock_transfer(
  p_transfer_id UUID,
  p_received_by UUID,
  p_items JSONB DEFAULT NULL  -- Optional: [{item_id, quantity_received, condition_on_receive, notes}]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
  v_received_item JSONB;
  v_received_qty DECIMAL(15,4);
  v_condition item_condition;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM stock_transfers WHERE id = p_transfer_id;
  
  IF v_transfer IS NULL THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;
  
  IF v_transfer.status != 'in_transit' THEN
    RAISE EXCEPTION 'Transfer cannot be received from status: %', v_transfer.status;
  END IF;
  
  -- Process each item
  FOR v_item IN 
    SELECT * FROM stock_transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    -- Get received details from input or default to shipped quantity
    v_received_qty := v_item.quantity_shipped;
    v_condition := v_item.condition_on_send;
    
    IF p_items IS NOT NULL THEN
      v_received_item := (
        SELECT jsonb_array_elements(p_items)
        WHERE (jsonb_array_elements(p_items)->>'item_id')::UUID = v_item.id
        LIMIT 1
      );
      
      IF v_received_item IS NOT NULL THEN
        v_received_qty := COALESCE((v_received_item->>'quantity_received')::DECIMAL, v_item.quantity_shipped);
        v_condition := COALESCE((v_received_item->>'condition_on_receive')::item_condition, v_item.condition_on_send);
      END IF;
    END IF;
    
    -- Add to destination location (create if doesn't exist)
    INSERT INTO product_stock_locations (product_id, location_id, quantity_on_hand, last_restocked_at, last_movement_at)
    VALUES (v_item.product_id, v_transfer.to_location_id, v_received_qty, NOW(), NOW())
    ON CONFLICT (product_id, location_id) 
    DO UPDATE SET 
      quantity_on_hand = product_stock_locations.quantity_on_hand + v_received_qty,
      last_restocked_at = NOW(),
      last_movement_at = NOW();
    
    -- Update received quantity
    UPDATE stock_transfer_items
    SET 
      quantity_received = v_received_qty,
      condition_on_receive = v_condition
    WHERE id = v_item.id;
  END LOOP;
  
  -- Update transfer status
  UPDATE stock_transfers
  SET 
    status = 'completed',
    received_date = CURRENT_DATE,
    received_by = p_received_by
  WHERE id = p_transfer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART G: FUNCTION TO SYNC PRODUCT TOTALS
-- =====================================================

-- Function to recalculate product totals from all locations
CREATE OR REPLACE FUNCTION sync_product_inventory_totals(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_on_hand DECIMAL(15,4);
  v_total_reserved DECIMAL(15,4);
BEGIN
  SELECT 
    COALESCE(SUM(quantity_on_hand), 0),
    COALESCE(SUM(quantity_reserved), 0)
  INTO v_total_on_hand, v_total_reserved
  FROM product_stock_locations
  WHERE product_id = p_product_id;
  
  UPDATE products
  SET 
    quantity_on_hand = v_total_on_hand,
    quantity_reserved = v_total_reserved
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync product totals when stock locations change
CREATE OR REPLACE FUNCTION trigger_sync_product_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_product_inventory_totals(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM sync_product_inventory_totals(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_product_inventory ON product_stock_locations;
CREATE TRIGGER trigger_sync_product_inventory
  AFTER INSERT OR UPDATE OR DELETE ON product_stock_locations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_product_totals();

-- =====================================================
-- PART H: ADD FOREIGN KEY FOR DEFAULT LOCATION
-- =====================================================

-- Add foreign key constraint for default_location_id on products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_products_default_location'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT fk_products_default_location 
    FOREIGN KEY (default_location_id) REFERENCES inventory_locations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_default_location ON products(default_location_id);

-- =====================================================
-- PART I: SEED DEFAULT LOCATION
-- =====================================================

-- Create default warehouse location
INSERT INTO inventory_locations (
  code, 
  name, 
  location_type, 
  city, 
  country, 
  is_default, 
  is_active,
  notes
) VALUES (
  'WH-001',
  'Main Warehouse',
  'warehouse',
  'Kampala',
  'Uganda',
  true,
  true,
  'Default warehouse location for all inventory'
) ON CONFLICT (code) DO NOTHING;

-- Create office location
INSERT INTO inventory_locations (
  code, 
  name, 
  location_type, 
  city, 
  country, 
  is_default, 
  is_active,
  notes
) VALUES (
  'OFF-001',
  'Head Office',
  'office',
  'Kampala',
  'Uganda',
  false,
  true,
  'Main office location'
) ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PART J: MIGRATE EXISTING INVENTORY TO DEFAULT LOCATION
-- =====================================================

-- Migrate existing products to default location
INSERT INTO product_stock_locations (
  product_id, 
  location_id, 
  quantity_on_hand, 
  quantity_reserved,
  reorder_point,
  reorder_quantity
)
SELECT 
  p.id,
  (SELECT id FROM inventory_locations WHERE is_default = true LIMIT 1),
  p.quantity_on_hand,
  p.quantity_reserved,
  p.reorder_point,
  p.reorder_quantity
FROM products p
WHERE p.track_inventory = true
  AND NOT EXISTS (
    SELECT 1 FROM product_stock_locations psl 
    WHERE psl.product_id = p.id
  )
  AND EXISTS (SELECT 1 FROM inventory_locations WHERE is_default = true);

-- Set default location for products
UPDATE products p
SET default_location_id = (
  SELECT id FROM inventory_locations WHERE is_default = true LIMIT 1
)
WHERE p.track_inventory = true
  AND p.default_location_id IS NULL
  AND EXISTS (SELECT 1 FROM inventory_locations WHERE is_default = true);

-- =====================================================
-- PART K: VIEW FOR LOCATION STOCK SUMMARY
-- =====================================================

CREATE OR REPLACE VIEW v_location_stock_summary AS
SELECT 
  il.id AS location_id,
  il.code AS location_code,
  il.name AS location_name,
  il.location_type,
  il.is_default,
  COUNT(DISTINCT psl.product_id) AS total_products,
  SUM(psl.quantity_on_hand) AS total_quantity,
  SUM(psl.quantity_on_hand * COALESCE(p.cost_price, 0)) AS total_value,
  COUNT(DISTINCT CASE WHEN psl.quantity_on_hand <= COALESCE(psl.reorder_point, p.reorder_point, 0) 
    AND psl.quantity_on_hand > 0 THEN psl.product_id END) AS low_stock_count,
  COUNT(DISTINCT CASE WHEN psl.quantity_on_hand = 0 THEN psl.product_id END) AS out_of_stock_count
FROM inventory_locations il
LEFT JOIN product_stock_locations psl ON il.id = psl.location_id
LEFT JOIN products p ON psl.product_id = p.id
WHERE il.is_active = true
GROUP BY il.id, il.code, il.name, il.location_type, il.is_default;

COMMENT ON VIEW v_location_stock_summary IS 'Summary of stock levels at each location';

-- =====================================================
-- PART L: VIEW FOR PRODUCT LOCATION BREAKDOWN
-- =====================================================

CREATE OR REPLACE VIEW v_product_location_breakdown AS
SELECT 
  p.id AS product_id,
  p.sku,
  p.name AS product_name,
  p.inventory_category,
  il.id AS location_id,
  il.code AS location_code,
  il.name AS location_name,
  psl.quantity_on_hand,
  psl.quantity_reserved,
  psl.quantity_available,
  psl.bin_location,
  psl.reorder_point,
  p.cost_price,
  (psl.quantity_on_hand * COALESCE(p.cost_price, 0)) AS location_value,
  psl.last_counted_at,
  psl.last_restocked_at
FROM products p
JOIN product_stock_locations psl ON p.id = psl.product_id
JOIN inventory_locations il ON psl.location_id = il.id
WHERE p.track_inventory = true
  AND p.is_active = true
  AND il.is_active = true
ORDER BY p.name, il.name;

COMMENT ON VIEW v_product_location_breakdown IS 'Detailed breakdown of product quantities by location';

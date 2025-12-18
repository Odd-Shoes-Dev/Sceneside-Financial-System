-- =====================================================
-- MIGRATION 025: INVENTORY COST LAYERS & VALUATION
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Proper FIFO/LIFO/Average cost tracking and valuation
-- =====================================================

-- =====================================================
-- PART A: INVENTORY COST LAYERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_cost_layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id),
  
  -- Cost Layer Details
  transaction_type VARCHAR(50) NOT NULL,
  -- Values: 'purchase', 'adjustment_in', 'transfer_in', 'initial', 'production', 'return'
  transaction_id UUID,
  transaction_date DATE NOT NULL,
  
  -- Quantities
  quantity_received DECIMAL(15,4) NOT NULL,
  quantity_remaining DECIMAL(15,4) NOT NULL,
  quantity_used DECIMAL(15,4) GENERATED ALWAYS AS (quantity_received - quantity_remaining) STORED,
  
  -- Costing
  unit_cost DECIMAL(15,4) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(12,6) DEFAULT 1.000000,
  unit_cost_base DECIMAL(15,4), -- Converted to base currency (USD)
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,
  remaining_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity_remaining * unit_cost) STORED,
  
  -- Tracking
  lot_number VARCHAR(100),
  batch_number VARCHAR(100),
  serial_numbers TEXT[],
  expiry_date DATE,
  
  -- Reference to source document
  reference_type VARCHAR(50), -- 'bill', 'purchase_order', 'adjustment', 'transfer'
  reference_number VARCHAR(100),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Status
  is_depleted BOOLEAN GENERATED ALWAYS AS (quantity_remaining <= 0) STORED,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cost_layers_product ON inventory_cost_layers(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_layers_location ON inventory_cost_layers(location_id);
CREATE INDEX IF NOT EXISTS idx_cost_layers_date ON inventory_cost_layers(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cost_layers_not_depleted ON inventory_cost_layers(product_id, location_id) 
  WHERE quantity_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_cost_layers_fifo ON inventory_cost_layers(product_id, location_id, transaction_date ASC) 
  WHERE quantity_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_cost_layers_lifo ON inventory_cost_layers(product_id, location_id, transaction_date DESC) 
  WHERE quantity_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_cost_layers_reference ON inventory_cost_layers(reference_type, transaction_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cost_layers_updated_at ON inventory_cost_layers;
CREATE TRIGGER update_cost_layers_updated_at
  BEFORE UPDATE ON inventory_cost_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE inventory_cost_layers IS 'Track cost layers for FIFO/LIFO/Average cost calculations';

-- =====================================================
-- PART B: INVENTORY TRANSACTIONS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  location_id UUID REFERENCES inventory_locations(id),
  
  -- Transaction Details
  transaction_number VARCHAR(50) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  -- Values: 'purchase', 'sale', 'adjustment_in', 'adjustment_out', 'transfer_in', 
  --         'transfer_out', 'return_in', 'return_out', 'write_off', 'initial'
  transaction_date DATE NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50),
  -- Values: 'invoice', 'bill', 'purchase_order', 'adjustment', 'transfer', 'manual'
  reference_id UUID,
  reference_number VARCHAR(100),
  
  -- Quantities (positive for in, negative for out)
  quantity DECIMAL(15,4) NOT NULL,
  quantity_before DECIMAL(15,4),
  quantity_after DECIMAL(15,4),
  
  -- Costing
  unit_cost DECIMAL(15,4),
  total_value DECIMAL(15,2),
  valuation_method valuation_method,
  
  -- Cost layers affected (for audit)
  cost_layers_affected JSONB,
  -- Example: [{"layer_id": "uuid", "quantity_used": 10, "unit_cost": 100}]
  
  -- Customer/Vendor
  customer_id UUID REFERENCES customers(id),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Journal entry created
  journal_entry_id UUID REFERENCES journal_entries(id),
  
  -- User & Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT unique_transaction_number UNIQUE(transaction_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_location ON inventory_transactions(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_customer ON inventory_transactions(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_vendor ON inventory_transactions(vendor_id) WHERE vendor_id IS NOT NULL;

COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory movements with costing';

-- =====================================================
-- PART C: TRANSACTION NUMBER SEQUENCE
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS inventory_transaction_seq START 1001;

CREATE OR REPLACE FUNCTION generate_inventory_transaction_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'IT-' || LPAD(nextval('inventory_transaction_seq')::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART D: FIFO COST CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_fifo_cost(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL(15,4)
)
RETURNS TABLE (
  total_cost DECIMAL(15,2),
  average_unit_cost DECIMAL(15,4),
  layers_used JSONB
) AS $$
DECLARE
  v_remaining_qty DECIMAL(15,4) := p_quantity;
  v_total_cost DECIMAL(15,2) := 0;
  v_layers_used JSONB := '[]'::JSONB;
  v_layer RECORD;
  v_qty_from_layer DECIMAL(15,4);
BEGIN
  -- Get cost layers ordered by oldest first (FIFO)
  FOR v_layer IN 
    SELECT id, quantity_remaining, unit_cost
    FROM inventory_cost_layers
    WHERE product_id = p_product_id
      AND (p_location_id IS NULL OR location_id = p_location_id)
      AND quantity_remaining > 0
    ORDER BY transaction_date ASC, created_at ASC
  LOOP
    EXIT WHEN v_remaining_qty <= 0;
    
    v_qty_from_layer := LEAST(v_layer.quantity_remaining, v_remaining_qty);
    v_total_cost := v_total_cost + (v_qty_from_layer * v_layer.unit_cost);
    
    v_layers_used := v_layers_used || jsonb_build_object(
      'layer_id', v_layer.id,
      'quantity_used', v_qty_from_layer,
      'unit_cost', v_layer.unit_cost
    );
    
    v_remaining_qty := v_remaining_qty - v_qty_from_layer;
  END LOOP;
  
  IF v_remaining_qty > 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Short by % units', v_remaining_qty;
  END IF;
  
  total_cost := v_total_cost;
  average_unit_cost := CASE WHEN p_quantity > 0 THEN v_total_cost / p_quantity ELSE 0 END;
  layers_used := v_layers_used;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART E: LIFO COST CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_lifo_cost(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL(15,4)
)
RETURNS TABLE (
  total_cost DECIMAL(15,2),
  average_unit_cost DECIMAL(15,4),
  layers_used JSONB
) AS $$
DECLARE
  v_remaining_qty DECIMAL(15,4) := p_quantity;
  v_total_cost DECIMAL(15,2) := 0;
  v_layers_used JSONB := '[]'::JSONB;
  v_layer RECORD;
  v_qty_from_layer DECIMAL(15,4);
BEGIN
  -- Get cost layers ordered by newest first (LIFO)
  FOR v_layer IN 
    SELECT id, quantity_remaining, unit_cost
    FROM inventory_cost_layers
    WHERE product_id = p_product_id
      AND (p_location_id IS NULL OR location_id = p_location_id)
      AND quantity_remaining > 0
    ORDER BY transaction_date DESC, created_at DESC
  LOOP
    EXIT WHEN v_remaining_qty <= 0;
    
    v_qty_from_layer := LEAST(v_layer.quantity_remaining, v_remaining_qty);
    v_total_cost := v_total_cost + (v_qty_from_layer * v_layer.unit_cost);
    
    v_layers_used := v_layers_used || jsonb_build_object(
      'layer_id', v_layer.id,
      'quantity_used', v_qty_from_layer,
      'unit_cost', v_layer.unit_cost
    );
    
    v_remaining_qty := v_remaining_qty - v_qty_from_layer;
  END LOOP;
  
  IF v_remaining_qty > 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Short by % units', v_remaining_qty;
  END IF;
  
  total_cost := v_total_cost;
  average_unit_cost := CASE WHEN p_quantity > 0 THEN v_total_cost / p_quantity ELSE 0 END;
  layers_used := v_layers_used;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART F: WEIGHTED AVERAGE COST CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_average_cost(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL(15,4)
)
RETURNS TABLE (
  total_cost DECIMAL(15,2),
  average_unit_cost DECIMAL(15,4),
  layers_used JSONB
) AS $$
DECLARE
  v_total_qty DECIMAL(15,4);
  v_total_value DECIMAL(15,2);
  v_avg_cost DECIMAL(15,4);
BEGIN
  -- Calculate weighted average from all layers
  SELECT 
    COALESCE(SUM(quantity_remaining), 0),
    COALESCE(SUM(quantity_remaining * unit_cost), 0)
  INTO v_total_qty, v_total_value
  FROM inventory_cost_layers
  WHERE product_id = p_product_id
    AND (p_location_id IS NULL OR location_id = p_location_id)
    AND quantity_remaining > 0;
  
  IF v_total_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Required: %', v_total_qty, p_quantity;
  END IF;
  
  v_avg_cost := CASE WHEN v_total_qty > 0 THEN v_total_value / v_total_qty ELSE 0 END;
  
  total_cost := p_quantity * v_avg_cost;
  average_unit_cost := v_avg_cost;
  layers_used := jsonb_build_object(
    'method', 'weighted_average',
    'total_quantity', v_total_qty,
    'average_cost', v_avg_cost
  );
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART G: CONSUME INVENTORY FUNCTION (Deduct from cost layers)
-- =====================================================

CREATE OR REPLACE FUNCTION consume_inventory(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL(15,4),
  p_valuation_method valuation_method DEFAULT 'fifo',
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
  transaction_id UUID,
  total_cost DECIMAL(15,2),
  average_unit_cost DECIMAL(15,4),
  layers_consumed JSONB
) AS $$
DECLARE
  v_cost_result RECORD;
  v_layer_info JSONB;
  v_layer RECORD;
  v_qty_to_consume DECIMAL(15,4);
  v_remaining_qty DECIMAL(15,4) := p_quantity;
  v_transaction_id UUID;
  v_transaction_number VARCHAR;
  v_quantity_before DECIMAL(15,4);
  v_quantity_after DECIMAL(15,4);
BEGIN
  -- Get current quantity
  SELECT COALESCE(quantity_on_hand, 0) INTO v_quantity_before
  FROM product_stock_locations
  WHERE product_id = p_product_id AND location_id = p_location_id;
  
  -- Calculate cost based on method
  IF p_valuation_method = 'fifo' THEN
    SELECT * INTO v_cost_result FROM calculate_fifo_cost(p_product_id, p_location_id, p_quantity);
  ELSIF p_valuation_method = 'lifo' THEN
    SELECT * INTO v_cost_result FROM calculate_lifo_cost(p_product_id, p_location_id, p_quantity);
  ELSE -- default to average
    SELECT * INTO v_cost_result FROM calculate_average_cost(p_product_id, p_location_id, p_quantity);
  END IF;
  
  -- Consume from cost layers based on method
  IF p_valuation_method IN ('fifo', 'lifo') THEN
    -- Process each layer in the result
    FOR v_layer_info IN SELECT * FROM jsonb_array_elements(v_cost_result.layers_used)
    LOOP
      UPDATE inventory_cost_layers
      SET quantity_remaining = quantity_remaining - (v_layer_info->>'quantity_used')::DECIMAL
      WHERE id = (v_layer_info->>'layer_id')::UUID;
    END LOOP;
  ELSE
    -- For average cost, reduce proportionally from all layers
    FOR v_layer IN 
      SELECT id, quantity_remaining, 
        (quantity_remaining / (SELECT SUM(quantity_remaining) FROM inventory_cost_layers 
          WHERE product_id = p_product_id AND location_id = p_location_id AND quantity_remaining > 0)) * p_quantity AS qty_to_reduce
      FROM inventory_cost_layers
      WHERE product_id = p_product_id
        AND location_id = p_location_id
        AND quantity_remaining > 0
    LOOP
      UPDATE inventory_cost_layers
      SET quantity_remaining = GREATEST(0, quantity_remaining - v_layer.qty_to_reduce)
      WHERE id = v_layer.id;
    END LOOP;
  END IF;
  
  -- Update stock location
  UPDATE product_stock_locations
  SET 
    quantity_on_hand = quantity_on_hand - p_quantity,
    last_movement_at = NOW()
  WHERE product_id = p_product_id AND location_id = p_location_id;
  
  -- Get quantity after
  SELECT COALESCE(quantity_on_hand, 0) INTO v_quantity_after
  FROM product_stock_locations
  WHERE product_id = p_product_id AND location_id = p_location_id;
  
  -- Create transaction record
  v_transaction_number := generate_inventory_transaction_number();
  
  INSERT INTO inventory_transactions (
    product_id, location_id, transaction_number, transaction_type,
    transaction_date, reference_type, reference_id, quantity,
    quantity_before, quantity_after, unit_cost, total_value,
    valuation_method, cost_layers_affected, customer_id, notes, created_by
  ) VALUES (
    p_product_id, p_location_id, v_transaction_number, 'sale',
    CURRENT_DATE, p_reference_type, p_reference_id, -p_quantity,
    v_quantity_before, v_quantity_after, v_cost_result.average_unit_cost, v_cost_result.total_cost,
    p_valuation_method, v_cost_result.layers_used, p_customer_id, p_notes, p_created_by
  ) RETURNING id INTO v_transaction_id;
  
  transaction_id := v_transaction_id;
  total_cost := v_cost_result.total_cost;
  average_unit_cost := v_cost_result.average_unit_cost;
  layers_consumed := v_cost_result.layers_used;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART H: ADD INVENTORY FUNCTION (Create cost layer)
-- =====================================================

CREATE OR REPLACE FUNCTION add_inventory(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL(15,4),
  p_unit_cost DECIMAL(15,4),
  p_transaction_type VARCHAR DEFAULT 'purchase',
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_vendor_id UUID DEFAULT NULL,
  p_batch_number VARCHAR DEFAULT NULL,
  p_lot_number VARCHAR DEFAULT NULL,
  p_expiry_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
  cost_layer_id UUID,
  transaction_id UUID
) AS $$
DECLARE
  v_cost_layer_id UUID;
  v_transaction_id UUID;
  v_transaction_number VARCHAR;
  v_quantity_before DECIMAL(15,4);
  v_quantity_after DECIMAL(15,4);
BEGIN
  -- Get current quantity
  SELECT COALESCE(quantity_on_hand, 0) INTO v_quantity_before
  FROM product_stock_locations
  WHERE product_id = p_product_id AND location_id = p_location_id;
  
  IF v_quantity_before IS NULL THEN
    v_quantity_before := 0;
  END IF;
  
  -- Create cost layer
  INSERT INTO inventory_cost_layers (
    product_id, location_id, transaction_type, transaction_date,
    quantity_received, quantity_remaining, unit_cost, batch_number,
    lot_number, expiry_date, reference_type, vendor_id, notes, created_by
  ) VALUES (
    p_product_id, p_location_id, p_transaction_type, CURRENT_DATE,
    p_quantity, p_quantity, p_unit_cost, p_batch_number,
    p_lot_number, p_expiry_date, p_reference_type, p_vendor_id, p_notes, p_created_by
  ) RETURNING id INTO v_cost_layer_id;
  
  -- Update stock location (create if doesn't exist)
  INSERT INTO product_stock_locations (product_id, location_id, quantity_on_hand, last_restocked_at, last_movement_at)
  VALUES (p_product_id, p_location_id, p_quantity, NOW(), NOW())
  ON CONFLICT (product_id, location_id) 
  DO UPDATE SET 
    quantity_on_hand = product_stock_locations.quantity_on_hand + p_quantity,
    last_restocked_at = NOW(),
    last_movement_at = NOW();
  
  -- Get quantity after
  SELECT COALESCE(quantity_on_hand, 0) INTO v_quantity_after
  FROM product_stock_locations
  WHERE product_id = p_product_id AND location_id = p_location_id;
  
  -- Update product's last purchase cost and average cost
  UPDATE products
  SET 
    last_purchase_cost = p_unit_cost,
    average_cost = (
      SELECT SUM(quantity_remaining * unit_cost) / NULLIF(SUM(quantity_remaining), 0)
      FROM inventory_cost_layers
      WHERE product_id = p_product_id AND quantity_remaining > 0
    )
  WHERE id = p_product_id;
  
  -- Create transaction record
  v_transaction_number := generate_inventory_transaction_number();
  
  INSERT INTO inventory_transactions (
    product_id, location_id, transaction_number, transaction_type,
    transaction_date, reference_type, reference_id, quantity,
    quantity_before, quantity_after, unit_cost, total_value,
    vendor_id, notes, created_by
  ) VALUES (
    p_product_id, p_location_id, v_transaction_number, p_transaction_type,
    CURRENT_DATE, p_reference_type, p_reference_id, p_quantity,
    v_quantity_before, v_quantity_after, p_unit_cost, p_quantity * p_unit_cost,
    p_vendor_id, p_notes, p_created_by
  ) RETURNING id INTO v_transaction_id;
  
  cost_layer_id := v_cost_layer_id;
  transaction_id := v_transaction_id;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART I: INVENTORY VALUATION VIEW
-- =====================================================

CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT 
  p.id AS product_id,
  p.sku,
  p.name AS product_name,
  p.inventory_category,
  p.stock_type,
  p.valuation_method,
  p.category_id,
  COALESCE(SUM(icl.quantity_remaining), 0) AS total_quantity,
  
  -- FIFO Value (sum of remaining values ordered by oldest first)
  COALESCE(SUM(icl.remaining_value), 0) AS fifo_value,
  
  -- LIFO Value (calculate based on newest layers first)
  COALESCE(SUM(icl.remaining_value), 0) AS lifo_value,
  
  -- Average Cost
  CASE WHEN SUM(icl.quantity_remaining) > 0 
    THEN SUM(icl.quantity_remaining * icl.unit_cost) / SUM(icl.quantity_remaining)
    ELSE COALESCE(p.cost_price, 0)
  END AS average_cost,
  
  -- Average Value
  COALESCE(SUM(icl.quantity_remaining), 0) * 
    CASE WHEN SUM(icl.quantity_remaining) > 0 
      THEN SUM(icl.quantity_remaining * icl.unit_cost) / SUM(icl.quantity_remaining)
      ELSE COALESCE(p.cost_price, 0)
    END AS average_value,
  
  -- Standard Cost Value
  COALESCE(SUM(icl.quantity_remaining), 0) * COALESCE(p.standard_cost, p.cost_price, 0) AS standard_value,
  
  -- Cost layer count
  COUNT(DISTINCT icl.id) FILTER (WHERE icl.quantity_remaining > 0) AS active_layers,
  
  -- Oldest layer date
  MIN(icl.transaction_date) FILTER (WHERE icl.quantity_remaining > 0) AS oldest_layer_date,
  
  -- Newest layer date  
  MAX(icl.transaction_date) FILTER (WHERE icl.quantity_remaining > 0) AS newest_layer_date
  
FROM products p
LEFT JOIN inventory_cost_layers icl ON p.id = icl.product_id
WHERE p.track_inventory = true
  AND p.is_active = true
  AND p.inventory_category = 'physical_stock'
GROUP BY p.id, p.sku, p.name, p.inventory_category, p.stock_type, p.valuation_method, p.cost_price, p.standard_cost, p.category_id;

COMMENT ON VIEW v_inventory_valuation IS 'Inventory valuation summary with FIFO, Average, and Standard costs';

-- =====================================================
-- PART J: MIGRATE EXISTING INVENTORY TO COST LAYERS
-- =====================================================

-- Create initial cost layers for existing products
INSERT INTO inventory_cost_layers (
  product_id,
  location_id,
  transaction_type,
  transaction_date,
  quantity_received,
  quantity_remaining,
  unit_cost,
  notes,
  reference_type
)
SELECT 
  psl.product_id,
  psl.location_id,
  'initial',
  CURRENT_DATE,
  psl.quantity_on_hand,
  psl.quantity_on_hand,
  COALESCE(p.cost_price, 0),
  'Initial cost layer from migration',
  'migration'
FROM product_stock_locations psl
JOIN products p ON psl.product_id = p.id
WHERE psl.quantity_on_hand > 0
  AND NOT EXISTS (
    SELECT 1 FROM inventory_cost_layers icl 
    WHERE icl.product_id = psl.product_id 
      AND icl.location_id = psl.location_id
  );

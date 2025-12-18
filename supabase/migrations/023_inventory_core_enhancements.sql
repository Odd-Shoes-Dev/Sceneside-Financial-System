-- =====================================================
-- MIGRATION 023: INVENTORY CORE ENHANCEMENTS
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Core inventory system improvements - enums, product enhancements, valuation
-- =====================================================

-- =====================================================
-- PART A: ENHANCED ENUMS
-- =====================================================

-- Stock type enum for physical stock categories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_type') THEN
    CREATE TYPE stock_type AS ENUM (
      'consumable',      -- Fuel, food, supplies (used up)
      'reusable',        -- Equipment that can be reused (tents, gear)
      'merchandise',     -- Items for resale (t-shirts, souvenirs)
      'spare_parts'      -- Maintenance parts for assets
    );
  END IF;
END $$;

-- Condition status for reusable items
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_condition') THEN
    CREATE TYPE item_condition AS ENUM (
      'new',
      'excellent',
      'good',
      'fair',
      'needs_repair',
      'out_of_service',
      'disposed'
    );
  END IF;
END $$;

-- Inventory category enum (extends product_type concept)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_category') THEN
    CREATE TYPE inventory_category AS ENUM (
      'physical_stock',   -- Tangible items
      'tour_product',     -- Services and capacity-based
      'permit',           -- Licenses, permits, intangibles
      'fixed_asset'       -- Long-term assets (reference existing)
    );
  END IF;
END $$;

-- Permit status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permit_status') THEN
    CREATE TYPE permit_status AS ENUM (
      'active',
      'expiring_soon',
      'expired',
      'pending_renewal',
      'suspended',
      'cancelled'
    );
  END IF;
END $$;

-- Tour schedule status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tour_schedule_status') THEN
    CREATE TYPE tour_schedule_status AS ENUM (
      'draft',
      'open',
      'nearly_full',
      'sold_out',
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- Location type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM (
      'warehouse',
      'office',
      'vehicle',
      'retail',
      'storage',
      'partner_site'
    );
  END IF;
END $$;

-- Transfer status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status') THEN
    CREATE TYPE transfer_status AS ENUM (
      'draft',
      'pending',
      'approved',
      'in_transit',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- Valuation method enum (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valuation_method') THEN
    CREATE TYPE valuation_method AS ENUM (
      'fifo',
      'lifo',
      'weighted_average',
      'standard'
    );
  END IF;
END $$;

-- =====================================================
-- PART B: ENHANCE PRODUCTS TABLE
-- =====================================================

-- Add inventory category field
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_category inventory_category DEFAULT 'physical_stock';

-- Add stock type for physical items
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_type stock_type;

-- Add condition tracking for reusable items
ALTER TABLE products ADD COLUMN IF NOT EXISTS item_condition item_condition DEFAULT 'new';

-- Add batch/lot tracking fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS lot_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add storage location reference (legacy - will use product_stock_locations)
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_location_id UUID;

-- Add maintenance tracking for reusable items
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER;

-- Add assignment tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS currently_assigned_to VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS assigned_tour_id UUID;

-- Add tour product fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS booked_capacity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tour_duration_hours DECIMAL(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inclusions TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS exclusions TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS age_restriction VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS equipment_list TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS includes_equipment BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_permits TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS seasonal_availability VARCHAR(255);

-- Add permit/license fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_issue_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_type VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_cost DECIMAL(15,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS renewal_frequency VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS renewal_reminder_days INTEGER DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_status permit_status DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_tour_ids UUID[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_product_ids UUID[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_quota INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS annual_quota INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS permit_used_quota INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS quota_used INTEGER DEFAULT 0;

-- Add valuation fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS valuation_method valuation_method DEFAULT 'fifo';
ALTER TABLE products ADD COLUMN IF NOT EXISTS standard_cost DECIMAL(15,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_purchase_cost DECIMAL(15,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_cost DECIMAL(15,2);

-- Add supplier link
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_vendor_id UUID REFERENCES vendors(id);

-- Add spare parts link to assets
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_asset_ids UUID[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_critical_part BOOLEAN DEFAULT false;

-- Add image support
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Add computed available capacity for tour products
-- Note: Using trigger instead of generated column for flexibility
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_capacity INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_inventory_category ON products(inventory_category);
CREATE INDEX IF NOT EXISTS idx_products_stock_type ON products(stock_type);
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition_status);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_permit_expiry ON products(permit_expiry_date) WHERE permit_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_permit_status ON products(permit_status) WHERE permit_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_valuation_method ON products(valuation_method);
CREATE INDEX IF NOT EXISTS idx_products_primary_vendor ON products(primary_vendor_id);

-- =====================================================
-- PART C: PRODUCT VARIANTS TABLE (For Merchandise)
-- =====================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant identification
  variant_name VARCHAR(255) NOT NULL,
  variant_sku VARCHAR(100),
  barcode VARCHAR(100),
  
  -- Variant attributes (e.g., size, color)
  attributes JSONB DEFAULT '{}',
  -- Example: {"size": "Large", "color": "Red"}
  
  -- Pricing
  additional_cost DECIMAL(15,2) DEFAULT 0,
  additional_price DECIMAL(15,2) DEFAULT 0,
  
  -- Inventory
  quantity_on_hand DECIMAL(15,4) DEFAULT 0,
  quantity_reserved DECIMAL(15,4) DEFAULT 0,
  reorder_point DECIMAL(15,4),
  
  -- Images
  image_url VARCHAR(500),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_variant_sku UNIQUE(variant_sku)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(variant_sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(product_id) WHERE is_active = true;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE product_variants IS 'Product variants for merchandise with different sizes, colors, etc.';

-- =====================================================
-- PART D: UPDATE PRODUCT CATEGORIES TABLE
-- =====================================================

-- Add parent category support and additional fields
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS inventory_category inventory_category;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS color VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_product_categories_inventory_cat ON product_categories(inventory_category);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;

-- =====================================================
-- PART E: TRIGGER TO UPDATE AVAILABLE CAPACITY
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_available_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.capacity IS NOT NULL THEN
    NEW.available_capacity := GREATEST(0, COALESCE(NEW.capacity, 0) - COALESCE(NEW.booked_capacity, 0));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_available_capacity ON products;
CREATE TRIGGER trigger_update_product_available_capacity
  BEFORE INSERT OR UPDATE OF capacity, booked_capacity ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_available_capacity();

-- =====================================================
-- PART F: FUNCTION TO CALCULATE PERMIT DAYS UNTIL EXPIRY
-- =====================================================

CREATE OR REPLACE FUNCTION get_permit_days_until_expiry(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_expiry_date DATE;
BEGIN
  SELECT permit_expiry_date INTO v_expiry_date
  FROM products
  WHERE id = p_product_id;
  
  IF v_expiry_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (v_expiry_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART G: FUNCTION TO AUTO-UPDATE PERMIT STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_permit_status()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
BEGIN
  IF NEW.inventory_category = 'permit' AND NEW.permit_expiry_date IS NOT NULL THEN
    days_until_expiry := NEW.permit_expiry_date - CURRENT_DATE;
    
    IF days_until_expiry < 0 THEN
      NEW.permit_status := 'expired';
    ELSIF days_until_expiry <= COALESCE(NEW.renewal_reminder_days, 30) THEN
      NEW.permit_status := 'expiring_soon';
    ELSE
      -- Only set to active if not already in pending_renewal or suspended
      IF NEW.permit_status NOT IN ('pending_renewal', 'suspended', 'cancelled') THEN
        NEW.permit_status := 'active';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_permit_status ON products;
CREATE TRIGGER trigger_update_permit_status
  BEFORE INSERT OR UPDATE OF permit_expiry_date, renewal_reminder_days ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_permit_status();

-- =====================================================
-- PART H: SEED DEFAULT CATEGORIES
-- =====================================================

-- Physical Stock Categories
INSERT INTO product_categories (name, description, code, inventory_category, sort_order, icon, is_active)
VALUES 
  ('Consumables', 'Items used up during operations (fuel, food, supplies)', 'CONS', 'physical_stock', 1, 'fire', true),
  ('Reusable Equipment', 'Equipment used repeatedly (tents, gear)', 'EQUIP', 'physical_stock', 2, 'cube', true),
  ('Merchandise', 'Items for resale (branded goods, souvenirs)', 'MERCH', 'physical_stock', 3, 'shopping-bag', true),
  ('Spare Parts', 'Maintenance parts for vehicles and equipment', 'PARTS', 'physical_stock', 4, 'cog', true)
ON CONFLICT DO NOTHING;

-- Tour Product Categories
INSERT INTO product_categories (name, description, code, inventory_category, sort_order, icon, is_active)
VALUES 
  ('Safari Packages', 'Multi-day safari tours', 'SAFARI', 'tour_product', 10, 'sun', true),
  ('Day Tours', 'Single day excursions', 'DAY', 'tour_product', 11, 'calendar', true),
  ('Cultural Tours', 'Cultural and community experiences', 'CULTURE', 'tour_product', 12, 'users', true),
  ('Adventure Activities', 'Hiking, trekking, and adventure sports', 'ADVENTURE', 'tour_product', 13, 'map', true),
  ('Transport Services', 'Vehicle and transfer services', 'TRANSPORT', 'tour_product', 14, 'truck', true),
  ('Accommodation', 'Hotel and lodge allocations', 'ACCOM', 'tour_product', 15, 'home', true)
ON CONFLICT DO NOTHING;

-- Permit Categories
INSERT INTO product_categories (name, description, code, inventory_category, sort_order, icon, is_active)
VALUES 
  ('National Park Permits', 'Park entry and activity permits', 'PARK', 'permit', 20, 'flag', true),
  ('Gorilla Trekking Permits', 'Gorilla and primate trekking permits', 'GORILLA', 'permit', 21, 'paw-print', true),
  ('Tour Operator Licenses', 'Business operating licenses', 'LICENSE', 'permit', 22, 'document', true),
  ('Vehicle Permits', 'Vehicle registration and permits', 'VEHICLE', 'permit', 23, 'car', true),
  ('Insurance Policies', 'Business and tour insurance', 'INSURANCE', 'permit', 24, 'shield', true),
  ('Staff Certifications', 'Guide and staff certifications', 'CERT', 'permit', 25, 'badge-check', true)
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN products.inventory_category IS 'Main classification: physical_stock, tour_product, permit, or fixed_asset';
COMMENT ON COLUMN products.stock_type IS 'For physical_stock: consumable, reusable, merchandise, or spare_parts';
COMMENT ON COLUMN products.valuation_method IS 'Cost calculation method: fifo, lifo, weighted_average, or standard';

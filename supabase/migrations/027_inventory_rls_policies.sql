-- =====================================================
-- MIGRATION 027: RLS POLICIES FOR INVENTORY TABLES
-- Sceneside L.L.C Financial System
-- Created: December 18, 2025
-- Purpose: Row Level Security policies for new inventory tables
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cost_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INVENTORY LOCATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view inventory locations" ON inventory_locations;
CREATE POLICY "Users can view inventory locations"
  ON inventory_locations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage locations" ON inventory_locations;
CREATE POLICY "Admins and managers can manage locations"
  ON inventory_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

-- =====================================================
-- PRODUCT STOCK LOCATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view product stock locations" ON product_stock_locations;
CREATE POLICY "Users can view product stock locations"
  ON product_stock_locations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage stock locations" ON product_stock_locations;
CREATE POLICY "Admins and managers can manage stock locations"
  ON product_stock_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

-- =====================================================
-- STOCK TRANSFERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view stock transfers" ON stock_transfers;
CREATE POLICY "Users can view stock transfers"
  ON stock_transfers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create stock transfers" ON stock_transfers;
CREATE POLICY "Users can create stock transfers"
  ON stock_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

DROP POLICY IF EXISTS "Users can update stock transfers" ON stock_transfers;
CREATE POLICY "Users can update stock transfers"
  ON stock_transfers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can delete stock transfers" ON stock_transfers;
CREATE POLICY "Admins can delete stock transfers"
  ON stock_transfers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND status = 'draft'
  );

-- =====================================================
-- STOCK TRANSFER ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view transfer items" ON stock_transfer_items;
CREATE POLICY "Users can view transfer items"
  ON stock_transfer_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage transfer items" ON stock_transfer_items;
CREATE POLICY "Admins and managers can manage transfer items"
  ON stock_transfer_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

-- =====================================================
-- INVENTORY COST LAYERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view cost layers" ON inventory_cost_layers;
CREATE POLICY "Users can view cost layers"
  ON inventory_cost_layers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can manage cost layers" ON inventory_cost_layers;
CREATE POLICY "System can manage cost layers"
  ON inventory_cost_layers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- =====================================================
-- INVENTORY TRANSACTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view inventory transactions" ON inventory_transactions;
CREATE POLICY "Users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can create inventory transactions" ON inventory_transactions;
CREATE POLICY "System can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

-- =====================================================
-- PRODUCT VARIANTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view product variants" ON product_variants;
CREATE POLICY "Users can view product variants"
  ON product_variants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and managers can manage variants" ON product_variants;
CREATE POLICY "Admins and managers can manage variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

-- =====================================================
-- TOUR SCHEDULES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view tour schedules" ON tour_schedules;
CREATE POLICY "Users can view tour schedules"
  ON tour_schedules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage tour schedules" ON tour_schedules;
CREATE POLICY "Users can manage tour schedules"
  ON tour_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

-- =====================================================
-- TOUR BOOKINGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view tour bookings" ON tour_bookings;
CREATE POLICY "Users can view tour bookings"
  ON tour_bookings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create tour bookings" ON tour_bookings;
CREATE POLICY "Users can create tour bookings"
  ON tour_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

DROP POLICY IF EXISTS "Users can update tour bookings" ON tour_bookings;
CREATE POLICY "Users can update tour bookings"
  ON tour_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

DROP POLICY IF EXISTS "Admins can delete tour bookings" ON tour_bookings;
CREATE POLICY "Admins can delete tour bookings"
  ON tour_bookings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PERMIT ALLOCATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view permit allocations" ON permit_allocations;
CREATE POLICY "Users can view permit allocations"
  ON permit_allocations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage permit allocations" ON permit_allocations;
CREATE POLICY "Users can manage permit allocations"
  ON permit_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

-- =====================================================
-- EQUIPMENT ASSIGNMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view equipment assignments" ON equipment_assignments;
CREATE POLICY "Users can view equipment assignments"
  ON equipment_assignments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage equipment assignments" ON equipment_assignments;
CREATE POLICY "Users can manage equipment assignments"
  ON equipment_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager', 'sales')
    )
  );

-- =====================================================
-- MAINTENANCE RECORDS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view maintenance records" ON maintenance_records;
CREATE POLICY "Users can view maintenance records"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage maintenance records" ON maintenance_records;
CREATE POLICY "Users can manage maintenance records"
  ON maintenance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON inventory_locations TO authenticated;
GRANT ALL ON product_stock_locations TO authenticated;
GRANT ALL ON stock_transfers TO authenticated;
GRANT ALL ON stock_transfer_items TO authenticated;
GRANT ALL ON inventory_cost_layers TO authenticated;
GRANT ALL ON inventory_transactions TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON tour_schedules TO authenticated;
GRANT ALL ON tour_bookings TO authenticated;
GRANT ALL ON permit_allocations TO authenticated;
GRANT ALL ON equipment_assignments TO authenticated;
GRANT ALL ON maintenance_records TO authenticated;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE transfer_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE inventory_transaction_seq TO authenticated;
GRANT USAGE ON SEQUENCE tour_booking_seq TO authenticated;

-- Grant view access
GRANT SELECT ON v_location_stock_summary TO authenticated;
GRANT SELECT ON v_product_location_breakdown TO authenticated;
GRANT SELECT ON v_inventory_valuation TO authenticated;
GRANT SELECT ON v_tour_schedule_summary TO authenticated;
GRANT SELECT ON v_permit_status TO authenticated;
GRANT SELECT ON v_equipment_status TO authenticated;

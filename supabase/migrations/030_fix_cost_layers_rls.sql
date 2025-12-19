-- =====================================================
-- MIGRATION 030: FIX COST LAYERS RLS FOR INVOICE PROCESSING
-- Sceneside L.L.C Financial System
-- Created: December 19, 2025
-- Purpose: Allow all authenticated users to update cost layers
--          when processing invoice inventory (COGS calculation)
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "System can manage cost layers" ON inventory_cost_layers;

-- Allow all authenticated users to update cost layers
-- This is needed for inventory consumption during invoice processing
CREATE POLICY "Users can update cost layers"
  ON inventory_cost_layers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins/accountants can insert or delete cost layers
CREATE POLICY "Admins can create cost layers"
  ON inventory_cost_layers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'manager')
    )
  );

CREATE POLICY "Admins can delete cost layers"
  ON inventory_cost_layers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

COMMENT ON POLICY "Users can update cost layers" ON inventory_cost_layers IS 
  'Allow cost layer updates for inventory consumption (COGS calculation)';

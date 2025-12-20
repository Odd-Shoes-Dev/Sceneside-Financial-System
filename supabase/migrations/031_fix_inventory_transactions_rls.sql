-- Migration: Fix inventory transactions RLS policy
-- Allow all authenticated users to create inventory transactions
-- This is needed because system operations (invoice/bill processing) create these records

-- Drop the restrictive policy
DROP POLICY IF EXISTS "System can create inventory transactions" ON inventory_transactions;

-- Create a more permissive policy for all authenticated users
CREATE POLICY "Authenticated users can create inventory transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also add UPDATE policy for reversals
DROP POLICY IF EXISTS "System can update inventory transactions" ON inventory_transactions;
CREATE POLICY "Authenticated users can update inventory transactions"
  ON inventory_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for cleanup operations
DROP POLICY IF EXISTS "System can delete inventory transactions" ON inventory_transactions;
CREATE POLICY "Authenticated users can delete inventory transactions"
  ON inventory_transactions FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "Authenticated users can create inventory transactions" ON inventory_transactions IS 'Allow all authenticated users to create inventory transaction records for invoice/bill processing';

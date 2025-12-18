-- =====================================================
-- MIGRATION 029: FIX JOURNAL ENTRY RLS FOR SYSTEM
-- Allow system-generated journal entries (from API)
-- Created: December 18, 2025
-- =====================================================

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Accountants can create/update draft journals" ON journal_entries;

-- Create new policy that allows authenticated users to create journal entries
-- This is needed for automatic journal entries from invoices, bills, etc.
CREATE POLICY "Authenticated users can create journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add comment
COMMENT ON POLICY "Authenticated users can create journal entries" ON journal_entries IS 
  'Allows system-generated journal entries from invoices, bills, and other automated processes';

-- =====================================================
-- CLEANING SCRIPT: Remove All Test/Business Data
-- Sceneside Financial System
-- Purpose: Wipe all transactional/test data, preserve reference tables
-- =====================================================

-- Disable triggers and constraints if needed (optional, depends on DB)
-- SET session_replication_role = 'replica';

-- Truncate transactional tables
TRUNCATE TABLE 
  journal_lines,
  journal_entries,
  inventory_cost_layers,
  inventory_transactions,
  inventory_movements,
  inventory_lots,
  invoices,
  invoice_lines,
  bills,
  bill_lines,
  payments_received,
  payment_applications,
  bill_payments,
  bill_payment_applications,
  purchase_orders,
  purchase_order_lines,
  goods_receipts,
  goods_receipt_lines,
  customers,
  vendors,
  products,
  expenses,
  fixed_assets,
  depreciation_entries,
  cash_transactions
RESTART IDENTITY CASCADE;

-- Optionally, delete from user_profiles if only test users exist
-- DELETE FROM user_profiles WHERE email LIKE '%test%' OR is_active = false;

-- Re-enable triggers and constraints (if disabled)
-- SET session_replication_role = 'origin';

-- Reference tables (accounts, company_settings, product_categories, enums, etc.) are preserved.
-- Review before running in production!

-- End of cleaning script

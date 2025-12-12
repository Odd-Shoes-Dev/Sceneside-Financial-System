-- =====================================================
-- SEED DATA - Chart of Accounts & Initial Setup
-- Sceneside L.L.C Financial System
-- =====================================================

-- Insert company settings
INSERT INTO company_settings (
  name, legal_name, ein, 
  address_line1, city, state, zip_code, country, phone,
  base_currency, fiscal_year_start_month, sales_tax_rate, inventory_method
) VALUES (
  'Sceneside L.L.C', 'Sceneside L.L.C', '99-3334108',
  '231 River St', 'Waltham', 'MA', '02453', 'USA', '857-384-2899',
  'USD', 1, 0.0625, 'fifo'
);

-- =====================================================
-- CHART OF ACCOUNTS
-- =====================================================

-- ASSETS (1000-1999)
INSERT INTO accounts (code, name, account_type, account_subtype, normal_balance, is_system) VALUES
-- Current Assets
('1000', 'Cash and Cash Equivalents', 'asset', 'cash', 'debit', true),
('1010', 'Petty Cash', 'asset', 'cash', 'debit', false),
('1020', 'Cash Drawer', 'asset', 'cash', 'debit', false),
('1100', 'Checking Account - Bank of America', 'asset', 'bank', 'debit', true),
('1110', 'Savings Account', 'asset', 'bank', 'debit', false),
('1200', 'Accounts Receivable', 'asset', 'receivable', 'debit', true),
('1210', 'Allowance for Doubtful Accounts', 'asset', 'receivable', 'credit', false),
('1300', 'Inventory', 'asset', 'inventory', 'debit', true),
('1310', 'Inventory - Raw Materials', 'asset', 'inventory', 'debit', false),
('1320', 'Inventory - Finished Goods', 'asset', 'inventory', 'debit', false),
('1400', 'Prepaid Expenses', 'asset', 'other_asset', 'debit', false),
('1410', 'Prepaid Insurance', 'asset', 'other_asset', 'debit', false),
('1420', 'Prepaid Rent', 'asset', 'other_asset', 'debit', false),
-- Fixed Assets
('1500', 'Fixed Assets', 'asset', 'fixed_asset', 'debit', true),
('1510', 'Furniture & Fixtures', 'asset', 'fixed_asset', 'debit', false),
('1520', 'Office Equipment', 'asset', 'fixed_asset', 'debit', false),
('1530', 'Computer Equipment', 'asset', 'fixed_asset', 'debit', false),
('1540', 'Vehicles', 'asset', 'fixed_asset', 'debit', false),
('1550', 'Machinery & Equipment', 'asset', 'fixed_asset', 'debit', false),
('1560', 'Leasehold Improvements', 'asset', 'fixed_asset', 'debit', false),
('1600', 'Accumulated Depreciation', 'asset', 'fixed_asset', 'credit', true),
('1610', 'Accum. Depr. - Furniture & Fixtures', 'asset', 'fixed_asset', 'credit', false),
('1620', 'Accum. Depr. - Office Equipment', 'asset', 'fixed_asset', 'credit', false),
('1630', 'Accum. Depr. - Computer Equipment', 'asset', 'fixed_asset', 'credit', false),
('1640', 'Accum. Depr. - Vehicles', 'asset', 'fixed_asset', 'credit', false),
('1650', 'Accum. Depr. - Machinery & Equipment', 'asset', 'fixed_asset', 'credit', false),
-- Other Assets
('1800', 'Security Deposits', 'asset', 'other_asset', 'debit', false),
('1900', 'Other Assets', 'asset', 'other_asset', 'debit', false);

-- LIABILITIES (2000-2999)
INSERT INTO accounts (code, name, account_type, account_subtype, normal_balance, is_system) VALUES
-- Current Liabilities
('2000', 'Accounts Payable', 'liability', 'payable', 'credit', true),
('2100', 'Accrued Expenses', 'liability', 'accrued', 'credit', false),
('2110', 'Accrued Wages', 'liability', 'accrued', 'credit', false),
('2120', 'Accrued Interest', 'liability', 'accrued', 'credit', false),
('2200', 'Sales Tax Payable', 'liability', 'payable', 'credit', true),
('2210', 'MA Sales Tax Payable', 'liability', 'payable', 'credit', false),
('2300', 'Payroll Liabilities', 'liability', 'payable', 'credit', false),
('2310', 'Federal Withholding Payable', 'liability', 'payable', 'credit', false),
('2320', 'State Withholding Payable', 'liability', 'payable', 'credit', false),
('2330', 'FICA Payable', 'liability', 'payable', 'credit', false),
('2340', 'Medicare Payable', 'liability', 'payable', 'credit', false),
('2400', 'Deferred Revenue', 'liability', 'other_liability', 'credit', false),
('2500', 'Credit Card Payable', 'liability', 'payable', 'credit', false),
('2600', 'Current Portion of Long-Term Debt', 'liability', 'loan', 'credit', false),
-- Long-Term Liabilities
('2700', 'Notes Payable', 'liability', 'loan', 'credit', false),
('2710', 'Bank Loans', 'liability', 'loan', 'credit', false),
('2720', 'Equipment Loans', 'liability', 'loan', 'credit', false),
('2800', 'Other Long-Term Liabilities', 'liability', 'other_liability', 'credit', false);

-- EQUITY (3000-3999)
INSERT INTO accounts (code, name, account_type, account_subtype, normal_balance, is_system) VALUES
('3000', 'Owner''s Equity', 'equity', 'capital', 'credit', true),
('3100', 'Owner''s Capital', 'equity', 'capital', 'credit', false),
('3200', 'Owner''s Draws', 'equity', 'capital', 'debit', false),
('3300', 'Retained Earnings', 'equity', 'retained_earnings', 'credit', true),
('3400', 'Current Year Earnings', 'equity', 'retained_earnings', 'credit', true),
('3500', 'Additional Paid-In Capital', 'equity', 'other_equity', 'credit', false);

-- REVENUE (4000-4999)
INSERT INTO accounts (code, name, account_type, account_subtype, normal_balance, is_system) VALUES
('4000', 'Revenue', 'revenue', 'sales', 'credit', true),
('4100', 'Sales Revenue', 'revenue', 'sales', 'credit', true),
('4110', 'Product Sales', 'revenue', 'sales', 'credit', false),
('4120', 'Service Revenue', 'revenue', 'service', 'credit', false),
('4200', 'Sales Discounts', 'revenue', 'sales', 'debit', false),
('4300', 'Sales Returns & Allowances', 'revenue', 'sales', 'debit', false),
('4400', 'Shipping & Handling Revenue', 'revenue', 'other_income', 'credit', false),
('4800', 'Interest Income', 'revenue', 'other_income', 'credit', false),
('4900', 'Other Income', 'revenue', 'other_income', 'credit', false);

-- EXPENSES (5000-5999 for COGS, 6000-6999 for Operating)
INSERT INTO accounts (code, name, account_type, account_subtype, normal_balance, is_system) VALUES
-- Cost of Goods Sold
('5000', 'Cost of Goods Sold', 'expense', 'cost_of_goods', 'debit', true),
('5100', 'Purchases', 'expense', 'cost_of_goods', 'debit', false),
('5110', 'Purchase Discounts', 'expense', 'cost_of_goods', 'credit', false),
('5120', 'Purchase Returns', 'expense', 'cost_of_goods', 'credit', false),
('5200', 'Freight In', 'expense', 'cost_of_goods', 'debit', false),
('5300', 'Direct Labor', 'expense', 'cost_of_goods', 'debit', false),
('5400', 'Manufacturing Overhead', 'expense', 'cost_of_goods', 'debit', false),

-- Operating Expenses
('6000', 'Operating Expenses', 'expense', 'operating', 'debit', true),
('6100', 'Wages & Salaries', 'expense', 'operating', 'debit', false),
('6110', 'Employee Benefits', 'expense', 'operating', 'debit', false),
('6120', 'Payroll Taxes', 'expense', 'operating', 'debit', false),
('6130', 'Contract Labor', 'expense', 'operating', 'debit', false),
('6200', 'Rent Expense', 'expense', 'operating', 'debit', false),
('6210', 'Utilities', 'expense', 'operating', 'debit', false),
('6220', 'Telephone & Internet', 'expense', 'operating', 'debit', false),
('6300', 'Insurance', 'expense', 'operating', 'debit', false),
('6310', 'General Liability Insurance', 'expense', 'operating', 'debit', false),
('6320', 'Workers Comp Insurance', 'expense', 'operating', 'debit', false),
('6400', 'Office Supplies', 'expense', 'administrative', 'debit', false),
('6410', 'Postage & Shipping', 'expense', 'administrative', 'debit', false),
('6420', 'Printing', 'expense', 'administrative', 'debit', false),
('6500', 'Professional Fees', 'expense', 'administrative', 'debit', false),
('6510', 'Accounting & Legal', 'expense', 'administrative', 'debit', false),
('6520', 'Consulting', 'expense', 'administrative', 'debit', false),
('6600', 'Bank Charges', 'expense', 'administrative', 'debit', false),
('6610', 'Credit Card Fees', 'expense', 'administrative', 'debit', false),
('6620', 'Stripe Fees', 'expense', 'administrative', 'debit', false),
('6700', 'Depreciation Expense', 'expense', 'depreciation', 'debit', true),
('6710', 'Amortization Expense', 'expense', 'depreciation', 'debit', false),

-- Marketing & Advertising
('7000', 'Marketing & Advertising', 'expense', 'marketing', 'debit', false),
('7100', 'Advertising', 'expense', 'marketing', 'debit', false),
('7110', 'Online Advertising', 'expense', 'marketing', 'debit', false),
('7120', 'Print Advertising', 'expense', 'marketing', 'debit', false),
('7200', 'Website & Hosting', 'expense', 'marketing', 'debit', false),
('7300', 'Promotional Materials', 'expense', 'marketing', 'debit', false),

-- Vehicle Expenses
('7500', 'Vehicle Expenses', 'expense', 'operating', 'debit', false),
('7510', 'Fuel', 'expense', 'operating', 'debit', false),
('7520', 'Vehicle Maintenance', 'expense', 'operating', 'debit', false),
('7530', 'Vehicle Insurance', 'expense', 'operating', 'debit', false),

-- Travel & Entertainment
('7600', 'Travel & Entertainment', 'expense', 'operating', 'debit', false),
('7610', 'Travel', 'expense', 'operating', 'debit', false),
('7620', 'Meals & Entertainment', 'expense', 'operating', 'debit', false),
('7630', 'Lodging', 'expense', 'operating', 'debit', false),

-- Repairs & Maintenance
('7700', 'Repairs & Maintenance', 'expense', 'operating', 'debit', false),
('7710', 'Equipment Repairs', 'expense', 'operating', 'debit', false),
('7720', 'Building Maintenance', 'expense', 'operating', 'debit', false),

-- Taxes
('8000', 'Taxes', 'expense', 'tax', 'debit', false),
('8100', 'Federal Income Tax', 'expense', 'tax', 'debit', false),
('8200', 'State Income Tax', 'expense', 'tax', 'debit', false),
('8300', 'Property Tax', 'expense', 'tax', 'debit', false),
('8400', 'Other Taxes', 'expense', 'tax', 'debit', false),

-- Other Expenses
('8800', 'Interest Expense', 'expense', 'other_expense', 'debit', false),
('8900', 'Other Expenses', 'expense', 'other_expense', 'debit', false),
('8910', 'Bad Debt Expense', 'expense', 'other_expense', 'debit', false),
('8920', 'Loss on Asset Disposal', 'expense', 'other_expense', 'debit', false);

-- Set parent account relationships
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1000') WHERE code IN ('1010', '1020');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1100') WHERE code IN ('1110');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1200') WHERE code IN ('1210');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1300') WHERE code IN ('1310', '1320');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1400') WHERE code IN ('1410', '1420');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1500') WHERE code IN ('1510', '1520', '1530', '1540', '1550', '1560');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1600') WHERE code IN ('1610', '1620', '1630', '1640', '1650');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2200') WHERE code IN ('2210');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2300') WHERE code IN ('2310', '2320', '2330', '2340');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2700') WHERE code IN ('2710', '2720');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '3000') WHERE code IN ('3100', '3200');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '4100') WHERE code IN ('4110', '4120');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5000') WHERE code IN ('5100', '5110', '5120', '5200', '5300', '5400');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6100') WHERE code IN ('6110', '6120', '6130');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6200') WHERE code IN ('6210', '6220');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6300') WHERE code IN ('6310', '6320');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6400') WHERE code IN ('6410', '6420');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6500') WHERE code IN ('6510', '6520');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '6600') WHERE code IN ('6610', '6620');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '7000') WHERE code IN ('7100', '7110', '7120', '7200', '7300');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '7500') WHERE code IN ('7510', '7520', '7530');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '7600') WHERE code IN ('7610', '7620', '7630');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '7700') WHERE code IN ('7710', '7720');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '8000') WHERE code IN ('8100', '8200', '8300', '8400');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '8900') WHERE code IN ('8910', '8920');

-- =====================================================
-- ASSET CATEGORIES
-- =====================================================

INSERT INTO asset_categories (name, description, default_useful_life_months, default_depreciation_method) VALUES
('Furniture & Fixtures', 'Office furniture, desks, chairs, etc.', 84, 'straight_line'),
('Office Equipment', 'Copiers, printers, phones, etc.', 60, 'straight_line'),
('Computer Equipment', 'Computers, servers, networking equipment', 36, 'straight_line'),
('Vehicles', 'Cars, trucks, vans', 60, 'straight_line'),
('Machinery & Equipment', 'Production machinery and equipment', 84, 'straight_line'),
('Leasehold Improvements', 'Building improvements on leased property', 120, 'straight_line');

-- Link asset categories to accounts
UPDATE asset_categories SET 
  depreciation_expense_account_id = (SELECT id FROM accounts WHERE code = '6700'),
  accumulated_depreciation_account_id = (SELECT id FROM accounts WHERE code = '1610')
WHERE name = 'Furniture & Fixtures';

UPDATE asset_categories SET 
  depreciation_expense_account_id = (SELECT id FROM accounts WHERE code = '6700'),
  accumulated_depreciation_account_id = (SELECT id FROM accounts WHERE code = '1620')
WHERE name = 'Office Equipment';

UPDATE asset_categories SET 
  depreciation_expense_account_id = (SELECT id FROM accounts WHERE code = '6700'),
  accumulated_depreciation_account_id = (SELECT id FROM accounts WHERE code = '1630')
WHERE name = 'Computer Equipment';

UPDATE asset_categories SET 
  depreciation_expense_account_id = (SELECT id FROM accounts WHERE code = '6700'),
  accumulated_depreciation_account_id = (SELECT id FROM accounts WHERE code = '1640')
WHERE name = 'Vehicles';

UPDATE asset_categories SET 
  depreciation_expense_account_id = (SELECT id FROM accounts WHERE code = '6700'),
  accumulated_depreciation_account_id = (SELECT id FROM accounts WHERE code = '1650')
WHERE name = 'Machinery & Equipment';

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================

INSERT INTO product_categories (name, description) VALUES
('General', 'General products and services'),
('Electronics', 'Electronic items'),
('Office Supplies', 'Office supplies and materials'),
('Services', 'Service offerings');

-- =====================================================
-- FISCAL PERIODS (2025)
-- =====================================================

INSERT INTO fiscal_periods (name, level, start_date, end_date, status) VALUES
('FY 2025', 'annual', '2025-01-01', '2025-12-31', 'open'),
('Q1 2025', 'quarterly', '2025-01-01', '2025-03-31', 'open'),
('Q2 2025', 'quarterly', '2025-04-01', '2025-06-30', 'open'),
('Q3 2025', 'quarterly', '2025-07-01', '2025-09-30', 'open'),
('Q4 2025', 'quarterly', '2025-10-01', '2025-12-31', 'open'),
('January 2025', 'monthly', '2025-01-01', '2025-01-31', 'open'),
('February 2025', 'monthly', '2025-02-01', '2025-02-28', 'open'),
('March 2025', 'monthly', '2025-03-01', '2025-03-31', 'open'),
('April 2025', 'monthly', '2025-04-01', '2025-04-30', 'open'),
('May 2025', 'monthly', '2025-05-01', '2025-05-31', 'open'),
('June 2025', 'monthly', '2025-06-01', '2025-06-30', 'open'),
('July 2025', 'monthly', '2025-07-01', '2025-07-31', 'open'),
('August 2025', 'monthly', '2025-08-01', '2025-08-31', 'open'),
('September 2025', 'monthly', '2025-09-01', '2025-09-30', 'open'),
('October 2025', 'monthly', '2025-10-01', '2025-10-31', 'open'),
('November 2025', 'monthly', '2025-11-01', '2025-11-30', 'open'),
('December 2025', 'monthly', '2025-12-01', '2025-12-31', 'open');

-- Set parent relationships for periods
UPDATE fiscal_periods SET parent_period_id = (SELECT id FROM fiscal_periods WHERE name = 'FY 2025') WHERE level = 'quarterly';
UPDATE fiscal_periods SET parent_period_id = (SELECT id FROM fiscal_periods WHERE name = 'Q1 2025') WHERE name IN ('January 2025', 'February 2025', 'March 2025');
UPDATE fiscal_periods SET parent_period_id = (SELECT id FROM fiscal_periods WHERE name = 'Q2 2025') WHERE name IN ('April 2025', 'May 2025', 'June 2025');
UPDATE fiscal_periods SET parent_period_id = (SELECT id FROM fiscal_periods WHERE name = 'Q3 2025') WHERE name IN ('July 2025', 'August 2025', 'September 2025');
UPDATE fiscal_periods SET parent_period_id = (SELECT id FROM fiscal_periods WHERE name = 'Q4 2025') WHERE name IN ('October 2025', 'November 2025', 'December 2025');

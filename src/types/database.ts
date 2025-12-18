// =====================================================
// Sceneside L.L.C Financial System - Database Types
// Auto-generated types for Supabase tables
// =====================================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type AccountSubtype =
  | 'cash' | 'bank' | 'receivable' | 'inventory' | 'fixed_asset' | 'other_asset'
  | 'payable' | 'accrued' | 'loan' | 'other_liability'
  | 'capital' | 'retained_earnings' | 'other_equity'
  | 'sales' | 'service' | 'other_income'
  | 'cost_of_goods' | 'operating' | 'administrative' | 'marketing' | 'depreciation' | 'tax' | 'other_expense';

export type JournalStatus = 'draft' | 'pending' | 'posted' | 'void';
export type PeriodStatus = 'open' | 'closed' | 'locked';
export type PeriodLevel = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export type DocumentType = 'invoice' | 'receipt' | 'quotation' | 'proforma';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void' | 'cancelled';
export type BillStatus = 'draft' | 'pending_approval' | 'approved' | 'partial' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'stripe' | 'other';

export type InventoryMethod = 'fifo' | 'lifo' | 'weighted_average';
export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'write_off';

export type AssetStatus = 'active' | 'disposed' | 'fully_depreciated';
export type DepreciationMethod = 'straight_line' | 'reducing_balance' | 'units_of_production';

export type UserRole = 'admin' | 'accountant' | 'manager' | 'sales' | 'auditor';
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

// =====================================================
// NEW INVENTORY SYSTEM TYPES
// =====================================================

// Stock Types for Physical Inventory
export type StockType = 'consumable' | 'reusable' | 'merchandise' | 'spare_parts';

// Item Condition for Reusable Items
export type ItemCondition = 'new' | 'excellent' | 'good' | 'fair' | 'needs_repair' | 'out_of_service' | 'disposed';

// Inventory Categories
export type InventoryCategory = 'physical_stock' | 'tour_product' | 'permit' | 'fixed_asset';

// Permit Status
export type PermitStatus = 'active' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'suspended' | 'cancelled';

// Tour Schedule Status
export type TourScheduleStatus = 'draft' | 'open' | 'nearly_full' | 'sold_out' | 'in_progress' | 'completed' | 'cancelled';

// Location Type
export type LocationType = 'warehouse' | 'office' | 'vehicle' | 'retail' | 'storage' | 'partner_site';

// Transfer Status
export type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';

// Valuation Method
export type ValuationMethod = 'fifo' | 'lifo' | 'weighted_average' | 'standard';

// Booking Status
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed' | 'no_show';

// Payment Status
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

// Assignment Type
export type AssignmentType = 'tour' | 'rental' | 'maintenance' | 'staff';

// Maintenance Type
export type MaintenanceType = 'scheduled' | 'repair' | 'inspection' | 'cleaning' | 'replacement';

// =====================================================
// CORE ENTITIES
// =====================================================

export interface CompanySettings {
  id: string;
  name: string;
  legal_name: string | null;
  ein: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  base_currency: string;
  fiscal_year_start_month: number;
  inventory_method: InventoryMethod;
  default_payment_terms: number;
  sales_tax_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  description: string | null;
  account_type: AccountType;
  account_subtype: AccountSubtype | null;
  parent_id: string | null;
  currency: string;
  is_system: boolean;
  is_active: boolean;
  is_bank_account: boolean;
  bank_account_id: string | null;
  normal_balance: 'debit' | 'credit';
  created_at: string;
  updated_at: string;
}

export interface FiscalPeriod {
  id: string;
  name: string;
  level: PeriodLevel;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  parent_period_id: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
}

// =====================================================
// GENERAL LEDGER
// =====================================================

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  period_id: string | null;
  description: string | null;
  memo: string | null;
  source_module: string | null;
  source_document_id: string | null;
  status: JournalStatus;
  is_adjusting: boolean;
  is_closing: boolean;
  is_reversing: boolean;
  reversed_entry_id: string | null;
  created_by: string | null;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  description: string | null;
  debit: number;
  credit: number;
  currency: string;
  exchange_rate: number;
  base_debit: number;
  base_credit: number;
  customer_id: string | null;
  vendor_id: string | null;
  project_id: string | null;
  department: string | null;
  created_at: string;
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[];
}

// =====================================================
// CUSTOMERS & VENDORS
// =====================================================

export interface Customer {
  id: string;
  customer_number: string | null;
  name: string;
  company_name: string | null;
  email: string | null;
  email_2: string | null;
  email_3: string | null;
  email_4: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  tax_exempt: boolean;
  tax_id: string | null;
  payment_terms: number;
  credit_limit: number | null;
  balance: number | null;
  currency: 'USD' | 'EUR' | 'GBP' | 'UGX';
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  vendor_number: string | null;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  tax_id: string | null;
  is_1099_vendor: boolean;
  payment_terms: number;
  currency: string;
  default_expense_account_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PRODUCTS & INVENTORY
// =====================================================

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  inventory_category: InventoryCategory | null;
  code: string | null;
  sort_order: number;
  is_active: boolean;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  product_type: 'inventory' | 'non_inventory' | 'service';
  unit_price: number;
  cost_price: number;
  currency: string;
  track_inventory: boolean;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  unit_of_measure: string;
  revenue_account_id: string | null;
  cogs_account_id: string | null;
  inventory_account_id: string | null;
  is_taxable: boolean;
  tax_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // New Inventory Category Fields
  inventory_category: InventoryCategory | null;
  stock_type: StockType | null;
  condition_status: ItemCondition | null;
  
  // Batch/Lot Tracking
  batch_number: string | null;
  lot_number: string | null;
  expiry_date: string | null;
  
  // Location
  default_location_id: string | null;
  
  // Maintenance Tracking (for reusable items)
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  maintenance_interval_days: number | null;
  
  // Assignment
  currently_assigned_to: string | null;
  assigned_tour_id: string | null;
  
  // Tour Product Fields
  capacity: number | null;
  booked_capacity: number | null;
  available_capacity: number | null;
  duration_days: number | null;
  duration_hours: number | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  meeting_point: string | null;
  difficulty_level: string | null;
  
  // Permit Fields
  issuing_authority: string | null;
  issue_date: string | null;
  permit_expiry_date: string | null;
  renewal_frequency: string | null;
  renewal_reminder_days: number | null;
  permit_status: PermitStatus | null;
  permit_number: string | null;
  linked_tour_ids: string[] | null;
  permit_quota: number | null;
  permit_used_quota: number | null;
  
  // Valuation
  valuation_method: ValuationMethod | null;
  standard_cost: number | null;
  last_purchase_cost: number | null;
  average_cost: number | null;
  
  // Supplier
  primary_vendor_id: string | null;
  
  // Spare Parts
  compatible_asset_ids: string[] | null;
  is_critical_part: boolean;
  
  // Images
  image_url: string | null;
  image_urls: string[] | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InventoryLot {
  id: string;
  product_id: string;
  lot_number: string | null;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  received_date: string;
  expiry_date: string | null;
  purchase_order_id: string | null;
  created_at: string;
}

// =====================================================
// INVOICES & RECEIVABLES
// =====================================================

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'UGX';
  exchange_rate: number;
  status: InvoiceStatus;
  payment_terms: number;
  po_number: string | null;
  notes: string | null;
  terms_and_conditions: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  pdf_url: string | null;
  journal_entry_id: string | null;
  ar_account_id: string | null;
  sent_at: string | null;
  sent_to_email: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  document_type: DocumentType;
  quotation_number: string | null;
  proforma_number: string | null;
  receipt_number: string | null;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  line_number: number;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  revenue_account_id: string | null;
  created_at: string;
}

export interface InvoiceWithLines extends Invoice {
  lines: InvoiceLine[];
  customer?: Customer;
}

export interface PaymentReceived {
  id: string;
  payment_number: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  stripe_payment_id: string | null;
  stripe_charge_id: string | null;
  deposit_to_account_id: string | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PaymentApplication {
  id: string;
  payment_id: string;
  invoice_id: string;
  amount_applied: number;
  created_at: string;
}

// =====================================================
// BILLS & PAYABLES
// =====================================================

export interface Bill {
  id: string;
  bill_number: string;
  vendor_id: string;
  vendor_invoice_number: string | null;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  exchange_rate: number;
  status: BillStatus;
  payment_terms: number;
  notes: string | null;
  attachment_url: string | null;
  journal_entry_id: string | null;
  ap_account_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillLine {
  id: string;
  bill_id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  expense_account_id: string | null;
  product_id: string | null;
  project_id: string | null;
  department: string | null;
  created_at: string;
}

export interface BillWithLines extends Bill {
  lines: BillLine[];
  vendor?: Vendor;
}

export interface BillPayment {
  id: string;
  payment_number: string;
  vendor_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  pay_from_account_id: string | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// =====================================================
// PURCHASE ORDERS
// =====================================================

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  order_date: string;
  expected_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: string;
  shipping_address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchase_order_id: string;
  line_number: number;
  product_id: string | null;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
}

// =====================================================
// EXPENSES
// =====================================================

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  payee: string | null;
  vendor_id: string | null;
  amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  expense_account_id: string;
  payment_account_id: string;
  category: string | null;
  department: string | null;
  project_id: string | null;
  description: string | null;
  receipt_url: string | null;
  is_reimbursable: boolean;
  is_billable: boolean;
  journal_entry_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// FIXED ASSETS
// =====================================================

export interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  default_useful_life_months: number | null;
  default_depreciation_method: DepreciationMethod;
  depreciation_expense_account_id: string | null;
  accumulated_depreciation_account_id: string | null;
  created_at: string;
}

export interface FixedAsset {
  id: string;
  asset_number: string;
  name: string;
  description: string | null;
  category_id: string | null;
  purchase_date: string;
  purchase_price: number;
  vendor_id: string | null;
  serial_number: string | null;
  depreciation_method: DepreciationMethod;
  useful_life_months: number;
  residual_value: number;
  depreciation_start_date: string;
  accumulated_depreciation: number;
  book_value: number;
  status: AssetStatus;
  disposal_date: string | null;
  disposal_price: number | null;
  disposal_journal_id: string | null;
  asset_account_id: string | null;
  location: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepreciationEntry {
  id: string;
  asset_id: string;
  period_id: string | null;
  depreciation_date: string;
  amount: number;
  journal_entry_id: string | null;
  created_at: string;
}

// =====================================================
// CASH & BANK
// =====================================================

export interface CashAccount {
  id: string;
  name: string;
  account_type: string;
  gl_account_id: string | null;
  currency: string;
  current_balance: number;
  custodian_user_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CashTransaction {
  id: string;
  cash_account_id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  reference_number: string | null;
  expense_id: string | null;
  journal_entry_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number_encrypted: string | null;
  routing_number: string | null;
  wire_routing_number: string | null;
  account_type: string;
  currency: string;
  gl_account_id: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankStatement {
  id: string;
  bank_account_id: string;
  statement_date: string;
  start_date: string;
  end_date: string;
  beginning_balance: number;
  ending_balance: number;
  is_reconciled: boolean;
  reconciled_by: string | null;
  reconciled_at: string | null;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  transaction_type: string | null;
  description: string | null;
  amount: number;
  reference_number: string | null;
  is_reconciled: boolean;
  reconciled_statement_id: string | null;
  matched_journal_line_id: string | null;
  created_at: string;
}

// =====================================================
// BUDGETS & RECURRING
// =====================================================

export interface Budget {
  id: string;
  name: string;
  fiscal_year: number;
  account_id: string;
  department: string | null;
  project_id: string | null;
  jan_amount: number;
  feb_amount: number;
  mar_amount: number;
  apr_amount: number;
  may_amount: number;
  jun_amount: number;
  jul_amount: number;
  aug_amount: number;
  sep_amount: number;
  oct_amount: number;
  nov_amount: number;
  dec_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  transaction_type: string;
  template_data: Record<string, unknown>;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  last_run_date: string | null;
  run_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PROJECTS & ALERTS
// =====================================================

export interface Project {
  id: string;
  project_number: string | null;
  name: string;
  customer_id: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  user_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: string;
  created_at: string;
}

// =====================================================
// INVENTORY LOCATION MANAGEMENT
// =====================================================

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  location_type: LocationType;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  is_active: boolean;
  is_mobile: boolean;
  total_capacity: number | null;
  capacity_unit: string;
  current_utilization: number;
  operating_hours: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProductStockLocation {
  id: string;
  product_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  min_stock_level: number | null;
  max_stock_level: number | null;
  bin_location: string | null;
  aisle: string | null;
  shelf: string | null;
  bin: string | null;
  last_counted_at: string | null;
  last_restocked_at: string | null;
  last_movement_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  transfer_date: string;
  status: TransferStatus;
  from_location_id: string;
  to_location_id: string;
  requested_date: string | null;
  shipped_date: string | null;
  expected_delivery_date: string | null;
  received_date: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  carrier: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  shipped_by: string | null;
  received_by: string | null;
  total_items: number;
  total_quantity: number;
  total_value: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  variant_id: string | null;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
  quantity_variance: number;
  unit_of_measure: string | null;
  unit_cost: number | null;
  line_value: number;
  batch_number: string | null;
  lot_number: string | null;
  serial_numbers: string[] | null;
  expiry_date: string | null;
  condition_on_send: ItemCondition | null;
  condition_on_receive: ItemCondition | null;
  from_bin_location: string | null;
  to_bin_location: string | null;
  notes: string | null;
  variance_reason: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// INVENTORY COST LAYERS & TRANSACTIONS
// =====================================================

export interface InventoryCostLayer {
  id: string;
  product_id: string;
  location_id: string | null;
  transaction_type: string;
  transaction_id: string | null;
  transaction_date: string;
  quantity_received: number;
  quantity_remaining: number;
  quantity_used: number;
  unit_cost: number;
  currency: string;
  exchange_rate: number;
  unit_cost_base: number | null;
  total_cost: number;
  remaining_value: number;
  lot_number: string | null;
  batch_number: string | null;
  serial_numbers: string[] | null;
  expiry_date: string | null;
  reference_type: string | null;
  reference_number: string | null;
  vendor_id: string | null;
  is_depleted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  variant_id: string | null;
  location_id: string | null;
  transaction_number: string;
  transaction_type: string;
  transaction_date: string;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  quantity: number;
  quantity_before: number | null;
  quantity_after: number | null;
  unit_cost: number | null;
  total_value: number | null;
  valuation_method: ValuationMethod | null;
  cost_layers_affected: Record<string, unknown>[] | null;
  customer_id: string | null;
  vendor_id: string | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// =====================================================
// PRODUCT VARIANTS
// =====================================================

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_sku: string | null;
  barcode: string | null;
  attributes: Record<string, unknown>;
  additional_cost: number;
  additional_price: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// TOUR SCHEDULES & BOOKINGS
// =====================================================

export interface TourSchedule {
  id: string;
  product_id: string;
  schedule_name: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  total_capacity: number;
  booked_capacity: number;
  available_capacity: number;
  min_participants: number;
  max_participants: number | null;
  status: TourScheduleStatus;
  price_override: number | null;
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  group_discount_percent: number | null;
  group_min_size: number | null;
  guide_id: string | null;
  guide_name: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  permit_ids: string[] | null;
  permits_confirmed: boolean;
  meeting_point: string | null;
  meeting_time: string | null;
  pickup_available: boolean;
  pickup_locations: string[] | null;
  internal_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TourBooking {
  id: string;
  schedule_id: string;
  product_id: string;
  booking_number: string;
  booking_date: string;
  booking_status: BookingStatus;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  num_adults: number;
  num_children: number;
  num_infants: number;
  total_participants: number;
  participant_details: Record<string, unknown>[];
  special_requests: string | null;
  dietary_requirements: string[] | null;
  accessibility_needs: string | null;
  pickup_required: boolean;
  pickup_location: string | null;
  pickup_time: string | null;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  invoice_id: string | null;
  permits_allocated: Record<string, unknown>[];
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================
// PERMITS & EQUIPMENT
// =====================================================

export interface PermitAllocation {
  id: string;
  permit_product_id: string;
  allocation_date: string;
  allocation_type: string;
  quantity: number;
  tour_booking_id: string | null;
  tour_schedule_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  permit_numbers: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  status: string;
  used_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EquipmentAssignment {
  id: string;
  product_id: string;
  assignment_type: AssignmentType;
  quantity: number;
  tour_schedule_id: string | null;
  customer_id: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  condition_on_checkout: ItemCondition | null;
  condition_on_return: ItemCondition | null;
  status: string;
  checked_out_at: string | null;
  checked_out_by: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  expected_return_date: string | null;
  checkout_notes: string | null;
  checkin_notes: string | null;
  damage_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  product_id: string;
  fixed_asset_id: string | null;
  maintenance_type: MaintenanceType;
  maintenance_date: string;
  completed_date: string | null;
  description: string;
  work_performed: string | null;
  condition_before: ItemCondition | null;
  condition_after: ItemCondition | null;
  parts_used: Record<string, unknown>[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  external_vendor_id: string | null;
  external_reference: string | null;
  next_maintenance_date: string | null;
  next_maintenance_type: string | null;
  status: string;
  bill_id: string | null;
  expense_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  performed_by: string | null;
}

// =====================================================
// EXTENDED INTERFACES WITH RELATIONS
// =====================================================

export interface ProductWithCategory extends Product {
  category?: ProductCategory;
}

export interface ProductWithLocations extends Product {
  stock_locations?: ProductStockLocation[];
  default_location?: InventoryLocation;
}

export interface StockTransferWithDetails extends StockTransfer {
  from_location?: InventoryLocation;
  to_location?: InventoryLocation;
  items?: StockTransferItem[];
}

export interface TourScheduleWithBookings extends TourSchedule {
  product?: Product;
  bookings?: TourBooking[];
}

// =====================================================
// DATABASE SCHEMA TYPE
// =====================================================

export interface Database {
  public: {
    Tables: {
      company_settings: { Row: CompanySettings; Insert: Partial<CompanySettings>; Update: Partial<CompanySettings> };
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> };
      accounts: { Row: Account; Insert: Partial<Account>; Update: Partial<Account> };
      fiscal_periods: { Row: FiscalPeriod; Insert: Partial<FiscalPeriod>; Update: Partial<FiscalPeriod> };
      journal_entries: { Row: JournalEntry; Insert: Partial<JournalEntry>; Update: Partial<JournalEntry> };
      journal_lines: { Row: JournalLine; Insert: Partial<JournalLine>; Update: Partial<JournalLine> };
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      vendors: { Row: Vendor; Insert: Partial<Vendor>; Update: Partial<Vendor> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_categories: { Row: ProductCategory; Insert: Partial<ProductCategory>; Update: Partial<ProductCategory> };
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> };
      inventory_movements: { Row: InventoryMovement; Insert: Partial<InventoryMovement>; Update: Partial<InventoryMovement> };
      inventory_lots: { Row: InventoryLot; Insert: Partial<InventoryLot>; Update: Partial<InventoryLot> };
      inventory_locations: { Row: InventoryLocation; Insert: Partial<InventoryLocation>; Update: Partial<InventoryLocation> };
      product_stock_locations: { Row: ProductStockLocation; Insert: Partial<ProductStockLocation>; Update: Partial<ProductStockLocation> };
      stock_transfers: { Row: StockTransfer; Insert: Partial<StockTransfer>; Update: Partial<StockTransfer> };
      stock_transfer_items: { Row: StockTransferItem; Insert: Partial<StockTransferItem>; Update: Partial<StockTransferItem> };
      inventory_cost_layers: { Row: InventoryCostLayer; Insert: Partial<InventoryCostLayer>; Update: Partial<InventoryCostLayer> };
      inventory_transactions: { Row: InventoryTransaction; Insert: Partial<InventoryTransaction>; Update: Partial<InventoryTransaction> };
      tour_schedules: { Row: TourSchedule; Insert: Partial<TourSchedule>; Update: Partial<TourSchedule> };
      tour_bookings: { Row: TourBooking; Insert: Partial<TourBooking>; Update: Partial<TourBooking> };
      permit_allocations: { Row: PermitAllocation; Insert: Partial<PermitAllocation>; Update: Partial<PermitAllocation> };
      equipment_assignments: { Row: EquipmentAssignment; Insert: Partial<EquipmentAssignment>; Update: Partial<EquipmentAssignment> };
      maintenance_records: { Row: MaintenanceRecord; Insert: Partial<MaintenanceRecord>; Update: Partial<MaintenanceRecord> };
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> };
      invoice_lines: { Row: InvoiceLine; Insert: Partial<InvoiceLine>; Update: Partial<InvoiceLine> };
      payments_received: { Row: PaymentReceived; Insert: Partial<PaymentReceived>; Update: Partial<PaymentReceived> };
      payment_applications: { Row: PaymentApplication; Insert: Partial<PaymentApplication>; Update: Partial<PaymentApplication> };
      bills: { Row: Bill; Insert: Partial<Bill>; Update: Partial<Bill> };
      bill_lines: { Row: BillLine; Insert: Partial<BillLine>; Update: Partial<BillLine> };
      bill_payments: { Row: BillPayment; Insert: Partial<BillPayment>; Update: Partial<BillPayment> };
      purchase_orders: { Row: PurchaseOrder; Insert: Partial<PurchaseOrder>; Update: Partial<PurchaseOrder> };
      purchase_order_lines: { Row: PurchaseOrderLine; Insert: Partial<PurchaseOrderLine>; Update: Partial<PurchaseOrderLine> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      asset_categories: { Row: AssetCategory; Insert: Partial<AssetCategory>; Update: Partial<AssetCategory> };
      fixed_assets: { Row: FixedAsset; Insert: Partial<FixedAsset>; Update: Partial<FixedAsset> };
      depreciation_entries: { Row: DepreciationEntry; Insert: Partial<DepreciationEntry>; Update: Partial<DepreciationEntry> };
      cash_accounts: { Row: CashAccount; Insert: Partial<CashAccount>; Update: Partial<CashAccount> };
      cash_transactions: { Row: CashTransaction; Insert: Partial<CashTransaction>; Update: Partial<CashTransaction> };
      bank_accounts: { Row: BankAccount; Insert: Partial<BankAccount>; Update: Partial<BankAccount> };
      bank_statements: { Row: BankStatement; Insert: Partial<BankStatement>; Update: Partial<BankStatement> };
      bank_transactions: { Row: BankTransaction; Insert: Partial<BankTransaction>; Update: Partial<BankTransaction> };
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> };
      recurring_transactions: { Row: RecurringTransaction; Insert: Partial<RecurringTransaction>; Update: Partial<RecurringTransaction> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      alerts: { Row: Alert; Insert: Partial<Alert>; Update: Partial<Alert> };
      activity_logs: { Row: ActivityLog; Insert: Partial<ActivityLog>; Update: Partial<ActivityLog> };
      exchange_rates: { Row: ExchangeRate; Insert: Partial<ExchangeRate>; Update: Partial<ExchangeRate> };
    };
  };
}

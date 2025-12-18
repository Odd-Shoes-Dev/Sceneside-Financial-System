# Inventory & COGS (Cost of Goods Sold) System
## Sceneside L.L.C Financial System

---

## Table of Contents
1. [What is COGS?](#what-is-cogs)
2. [System Overview](#system-overview)
3. [Inventory Flow Lifecycle](#inventory-flow-lifecycle)
4. [Cost Layer System](#cost-layer-system)
5. [Purchase/Bill Process](#purchasebill-process)
6. [Invoice/Sale Process](#invoicesale-process)
7. [COGS Calculation Methods](#cogs-calculation-methods)
8. [Journal Entries](#journal-entries)
9. [Database Tables](#database-tables)
10. [Example Scenarios](#example-scenarios)

---

## What is COGS?

**Cost of Goods Sold (COGS)** is an accounting concept that represents the direct costs of producing or purchasing the goods that a company sells during a specific period. COGS is a critical expense that directly impacts gross profit and net income.

### Why COGS Matters:
- **Profitability Analysis**: Helps calculate gross profit (Revenue - COGS)
- **Inventory Valuation**: Determines the value of remaining inventory
- **Tax Compliance**: Required for accurate financial reporting
- **Pricing Decisions**: Understanding cost helps set profitable prices
- **Financial Health**: Key metric for investors and stakeholders

### Basic Formula:
```
Gross Profit = Revenue - COGS
Net Income = Gross Profit - Operating Expenses
```

---

## System Overview

The Sceneside inventory system tracks physical products from purchase to sale, automatically calculating COGS and maintaining accurate inventory valuations.

### Key Components:
1. **Products**: Items tracked in inventory (physical_stock)
2. **Cost Layers**: Historical purchase costs using FIFO/LIFO
3. **Inventory Transactions**: All movements (purchases, sales, adjustments)
4. **Invoices**: Trigger inventory deduction and COGS calculation
5. **Bills/Purchase Orders**: Create cost layers when inventory is received
6. **Journal Entries**: Automatic accounting entries for COGS

---

## Inventory Flow Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

1. PURCHASE/RECEIVE
   ↓
   Create Bill or Purchase Order
   ↓
   Receive Inventory → Creates Cost Layer
   ↓
   DR Inventory Asset (1300)    $500
   CR Accounts Payable (2000)         $500

2. STORAGE
   ↓
   Inventory sits in cost layers
   Available for sale
   Tracked by location

3. SALE
   ↓
   Create Invoice → Change Status to "Sent"
   ↓
   Consume Inventory from Cost Layers (FIFO/LIFO)
   ↓
   Calculate COGS from consumed layers
   ↓
   DR Cost of Goods Sold (5100)  $300
   CR Inventory Asset (1300)           $300
   ↓
   AND
   ↓
   DR Accounts Receivable (1200) $500
   CR Sales Revenue (4000)             $500

4. FINANCIAL REPORTING
   ↓
   Gross Profit = Revenue ($500) - COGS ($300) = $200
```

---

## Cost Layer System

Cost layers are the foundation of accurate COGS calculation. Each time inventory is purchased at a specific price, a new cost layer is created.

### What is a Cost Layer?

A cost layer is a record that tracks:
- **Product ID**: Which item was purchased
- **Received Date**: When it arrived
- **Quantity Received**: How many units
- **Remaining Quantity**: How many units are still available
- **Unit Cost**: Price per unit
- **Total Cost**: Unit cost × quantity
- **Reference**: Purchase order or bill that created it

### Database Structure:
```sql
CREATE TABLE inventory_cost_layers (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES inventory_locations(id),
  received_date DATE NOT NULL,
  quantity_received NUMERIC NOT NULL,
  remaining_quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  reference_type TEXT, -- 'purchase_order', 'bill', 'adjustment'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example Cost Layers:

**Product: Tires**

| Layer ID | Received Date | Qty Received | Remaining | Unit Cost | Total Cost | Reference |
|----------|---------------|--------------|-----------|-----------|------------|-----------|
| layer-1  | 2025-01-01    | 50           | 50        | $20       | $1,000     | PO-001    |
| layer-2  | 2025-02-15    | 50           | 50        | $25       | $1,250     | PO-002    |
| **Total**|               | **100**      | **100**   |           | **$2,250** |           |

**Average Cost**: $2,250 ÷ 100 = $22.50 per tire

---

## Purchase/Bill Process

When you purchase inventory, the system creates cost layers that will be used later for COGS calculation.

### Step-by-Step Purchase Flow:

#### 1. Create a Bill/Purchase Order
```json
{
  "vendor_id": "vendor-123",
  "bill_date": "2025-12-18",
  "due_date": "2026-01-18",
  "lines": [
    {
      "product_id": "product-tires",
      "quantity": 100,
      "unit_price": 25,
      "total": 2500
    }
  ],
  "total_amount": 2500
}
```

#### 2. Mark as Received (or Auto-receive)
When inventory is received, the system:

**a) Creates Cost Layer:**
```sql
INSERT INTO inventory_cost_layers (
  product_id,
  received_date,
  quantity_received,
  remaining_quantity,
  unit_cost,
  total_cost,
  reference_type,
  reference_id
) VALUES (
  'product-tires',
  '2025-12-18',
  100,
  100,
  25.00,
  2500.00,
  'bill',
  'bill-123'
);
```

**b) Updates Product Quantity:**
```sql
UPDATE products
SET quantity_on_hand = quantity_on_hand + 100
WHERE id = 'product-tires';
```

**c) Creates Inventory Transaction:**
```sql
INSERT INTO inventory_transactions (
  product_id,
  transaction_type,
  quantity,
  unit_cost,
  total_cost,
  reference_type,
  reference_id,
  notes
) VALUES (
  'product-tires',
  'purchase',
  100,
  25.00,
  2500.00,
  'bill',
  'bill-123',
  'Purchased from vendor'
);
```

**d) Creates Journal Entry:**
```
Date: 2025-12-18
Description: Inventory purchase - Bill #bill-123

DR  Inventory Asset (1300)      $2,500.00
    CR  Accounts Payable (2000)            $2,500.00

Total: $2,500.00
```

---

## Invoice/Sale Process

When you sell inventory through an invoice, the system deducts quantity and calculates COGS.

### Step-by-Step Invoice Flow:

#### 1. Create Invoice (Draft)
```json
{
  "customer_id": "customer-456",
  "invoice_date": "2025-12-18",
  "status": "draft",
  "lines": [
    {
      "product_id": "product-tires",
      "quantity": 17,
      "unit_price": 50,
      "total": 850
    }
  ],
  "total_amount": 850
}
```

At this stage:
- ✅ Stock validation occurs (checks if 17 tires available)
- ❌ NO inventory deduction yet
- ❌ NO COGS calculated yet

#### 2. Change Status to "Sent" or "Paid"
When status changes from draft → sent/paid, the system automatically:

**a) Calls `processInvoiceInventory()`:**
```typescript
const result = await processInvoiceInventory(
  invoiceId,
  invoiceLines,
  customerId,
  userId,
  supabase
);
```

**b) Consumes Inventory from Cost Layers (FIFO Example):**

**Before Sale:**
| Layer | Received | Remaining | Unit Cost | Total Cost |
|-------|----------|-----------|-----------|------------|
| layer-1 | 2025-01-01 | 50 | $20 | $1,000 |
| layer-2 | 2025-02-15 | 50 | $25 | $1,250 |

**Selling 17 tires using FIFO (First In, First Out):**
- Take 17 from layer-1 (oldest)
- COGS = 17 × $20 = $340

**After Sale:**
| Layer | Received | Remaining | Unit Cost | Total Cost |
|-------|----------|-----------|-----------|------------|
| layer-1 | 2025-01-01 | **33** | $20 | $660 |
| layer-2 | 2025-02-15 | 50 | $25 | $1,250 |

**c) Updates Cost Layers:**
```sql
UPDATE inventory_cost_layers
SET remaining_quantity = 33
WHERE id = 'layer-1';
```

**d) Updates Product Quantity:**
```sql
UPDATE products
SET quantity_on_hand = quantity_on_hand - 17
WHERE id = 'product-tires';
-- Result: 100 → 83 tires
```

**e) Creates Inventory Transaction:**
```sql
INSERT INTO inventory_transactions (
  product_id,
  transaction_type,
  quantity,
  unit_cost,
  total_cost,
  reference_type,
  reference_id,
  notes
) VALUES (
  'product-tires',
  'sale',
  -17,
  20.00,
  -340.00,
  'invoice',
  'invoice-789',
  'Consumed for invoice invoice-789'
);
```

**f) Creates COGS Journal Entry:**
```
Date: 2025-12-18
Description: COGS for invoice invoice-789

DR  Cost of Goods Sold (5100)   $340.00
    CR  Inventory Asset (1300)            $340.00

Total: $340.00
```

**g) Creates Revenue Journal Entry (separate process):**
```
Date: 2025-12-18
Description: Invoice #invoice-789

DR  Accounts Receivable (1200)  $850.00
    CR  Sales Revenue (4000)              $850.00

Total: $850.00
```

#### 3. Financial Impact

**Income Statement:**
```
Sales Revenue:              $850.00
Less: Cost of Goods Sold:  ($340.00)
─────────────────────────────────
Gross Profit:               $510.00
Gross Margin:               60%
```

**Balance Sheet Impact:**
```
Assets:
  Accounts Receivable:  +$850.00
  Inventory:            -$340.00
  Net Asset Change:     +$510.00
```

---

## COGS Calculation Methods

The system supports three costing methods for calculating COGS:

### 1. FIFO (First In, First Out) - DEFAULT
**Principle**: Sell the oldest inventory first

**Example:**
- Purchase 1: 50 units @ $20 (Jan 1)
- Purchase 2: 50 units @ $25 (Feb 1)
- Sell: 60 units

**COGS Calculation:**
- Take 50 from Purchase 1 @ $20 = $1,000
- Take 10 from Purchase 2 @ $25 = $250
- **Total COGS: $1,250**

**Advantages:**
- Reflects actual physical flow of goods
- Lower COGS during inflation (older, cheaper costs)
- Higher net income during rising prices

### 2. LIFO (Last In, First Out)
**Principle**: Sell the newest inventory first

**Example:**
- Purchase 1: 50 units @ $20 (Jan 1)
- Purchase 2: 50 units @ $25 (Feb 1)
- Sell: 60 units

**COGS Calculation:**
- Take 50 from Purchase 2 @ $25 = $1,250
- Take 10 from Purchase 1 @ $20 = $200
- **Total COGS: $1,450**

**Advantages:**
- Better matches current costs with current revenues
- Higher COGS during inflation
- Lower taxable income during rising prices

### 3. Weighted Average
**Principle**: Use average cost of all inventory

**Example:**
- Purchase 1: 50 units @ $20 = $1,000
- Purchase 2: 50 units @ $25 = $1,250
- Total: 100 units @ avg $22.50 = $2,250
- Sell: 60 units

**COGS Calculation:**
- 60 units @ $22.50 = $1,350
- **Total COGS: $1,350**

**Advantages:**
- Smooths out price fluctuations
- Simple to understand
- Reduces impact of price volatility

### Current Implementation:
```typescript
// In products table
valuation_method: 'fifo' | 'lifo' | 'weighted_average'

// Default: FIFO
// Configured per product
```

---

## Journal Entries

All inventory movements create automatic journal entries to maintain accurate books.

### 1. Purchase Inventory (Bill Created)
```
DR  Inventory Asset (1300)      $2,500.00
    CR  Accounts Payable (2000)            $2,500.00
```
**Impact**: Increases assets (inventory), increases liabilities (payable)

### 2. Pay Vendor for Inventory
```
DR  Accounts Payable (2000)     $2,500.00
    CR  Cash/Bank (1000)                   $2,500.00
```
**Impact**: Decreases liabilities, decreases cash

### 3. Sell Inventory (Invoice Sent) - COGS Entry
```
DR  Cost of Goods Sold (5100)   $340.00
    CR  Inventory Asset (1300)            $340.00
```
**Impact**: Increases expenses (COGS), decreases assets (inventory)

### 4. Sell Inventory (Invoice Sent) - Revenue Entry
```
DR  Accounts Receivable (1200)  $850.00
    CR  Sales Revenue (4000)              $850.00
```
**Impact**: Increases assets (receivable), increases revenue

### 5. Receive Payment from Customer
```
DR  Cash/Bank (1000)            $850.00
    CR  Accounts Receivable (1200)        $850.00
```
**Impact**: Increases cash, decreases receivables

### 6. Void Invoice (Reverse COGS)
```
DR  Inventory Asset (1300)      $340.00
    CR  Cost of Goods Sold (5100)         $340.00
```
**Impact**: Restores inventory value, reverses COGS expense

---

## Database Tables

### Core Tables Involved:

#### 1. `products`
Stores product master data
```sql
- id: UUID
- name: TEXT
- sku: TEXT
- inventory_category: 'physical_stock' | 'tour_product' | 'permit'
- stock_type: 'consumable' | 'non_consumable'
- track_inventory: BOOLEAN
- valuation_method: 'fifo' | 'lifo' | 'weighted_average'
- quantity_on_hand: NUMERIC
- quantity_available: NUMERIC (computed)
- unit_cost: NUMERIC (for reference)
- selling_price: NUMERIC
```

#### 2. `inventory_cost_layers`
Tracks purchase costs for COGS calculation
```sql
- id: UUID
- product_id: UUID
- location_id: UUID
- received_date: DATE
- quantity_received: NUMERIC
- remaining_quantity: NUMERIC
- unit_cost: NUMERIC
- total_cost: NUMERIC
- reference_type: TEXT
- reference_id: UUID
```

#### 3. `inventory_transactions`
Audit trail of all inventory movements
```sql
- id: UUID
- product_id: UUID
- location_id: UUID
- transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return'
- quantity: NUMERIC (positive or negative)
- unit_cost: NUMERIC
- total_cost: NUMERIC
- reference_type: TEXT
- reference_id: UUID
- notes: TEXT
- created_at: TIMESTAMPTZ
```

#### 4. `invoices` & `invoice_lines`
Sales transactions that trigger COGS
```sql
invoices:
- id: UUID
- customer_id: UUID
- invoice_number: TEXT
- invoice_date: DATE
- status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void'
- total_amount: NUMERIC

invoice_lines:
- id: UUID
- invoice_id: UUID
- product_id: UUID
- quantity: NUMERIC
- unit_price: NUMERIC
- total: NUMERIC
```

#### 5. `bills` & `bill_lines`
Purchase transactions that create cost layers
```sql
bills:
- id: UUID
- vendor_id: UUID
- bill_number: TEXT
- bill_date: DATE
- status: 'draft' | 'approved' | 'paid'
- total_amount: NUMERIC

bill_lines:
- id: UUID
- bill_id: UUID
- product_id: UUID
- quantity: NUMERIC
- unit_cost: NUMERIC
- total: NUMERIC
```

#### 6. `journal_entries` & `journal_entry_lines`
Accounting entries for COGS and inventory
```sql
journal_entries:
- id: UUID
- entry_number: TEXT
- entry_date: DATE
- description: TEXT
- source_module: 'inventory' | 'invoices' | 'bills'
- source_document_id: UUID
- status: 'draft' | 'posted'
- total_debit: NUMERIC
- total_credit: NUMERIC

journal_entry_lines:
- id: UUID
- journal_entry_id: UUID
- account_id: UUID
- description: TEXT
- debit: NUMERIC
- credit: NUMERIC
```

---

## Example Scenarios

### Scenario 1: Simple Sale with One Cost Layer

**Initial State:**
- Product: Office Chairs
- Quantity: 20 units
- Cost Layer: 20 units @ $50 = $1,000

**Transaction:**
- Sell 5 chairs @ $120 each on invoice INV-001
- Status changed: draft → sent

**System Actions:**
1. Consume 5 units from cost layer
   - COGS = 5 × $50 = $250
2. Update quantity: 20 → 15 chairs
3. Update cost layer: 20 → 15 remaining
4. Create COGS journal entry: DR COGS $250, CR Inventory $250
5. Create revenue entry: DR AR $600, CR Revenue $600

**Financial Result:**
- Revenue: $600
- COGS: $250
- **Gross Profit: $350 (58.3% margin)**

---

### Scenario 2: Sale Across Multiple Cost Layers (FIFO)

**Initial State:**
- Product: Laptop Batteries
- Layer 1: 10 units @ $30 (Jan 1)
- Layer 2: 15 units @ $35 (Feb 1)
- Total: 25 units, Total cost: $825

**Transaction:**
- Sell 12 batteries @ $80 each on invoice INV-002
- Status changed: draft → sent

**System Actions (FIFO):**
1. Consume from Layer 1: 10 units @ $30 = $300
2. Consume from Layer 2: 2 units @ $35 = $70
3. **Total COGS = $370**
4. Update quantities:
   - Layer 1: 10 → 0 remaining
   - Layer 2: 15 → 13 remaining
   - Product: 25 → 13 units
5. Create COGS entry: DR COGS $370, CR Inventory $370
6. Create revenue entry: DR AR $960, CR Revenue $960

**Financial Result:**
- Revenue: $960
- COGS: $370
- **Gross Profit: $590 (61.5% margin)**

**Remaining Inventory Value:**
- 13 units @ $35 = $455

---

### Scenario 3: Zero-Cost Inventory (No Cost Layers)

**Initial State:**
- Product: Tires
- Quantity: 100 units
- Cost Layers: **NONE** (legacy product, never purchased through system)

**Transaction:**
- Sell 17 tires @ $50 each on invoice INV-003
- Status changed: draft → sent

**System Actions:**
1. No cost layers found
2. System allows zero-cost consumption (fallback logic)
3. Deduct quantity: 100 → 83 tires
4. COGS = $0 (no cost layers to consume)
5. Create inventory transaction with $0 cost
6. **No COGS journal entry created** (totalCost = 0)
7. Create revenue entry: DR AR $850, CR Revenue $850

**Financial Result:**
- Revenue: $850
- COGS: $0 (⚠️ ISSUE!)
- **Gross Profit: $850 (100% margin - INACCURATE)**

**Solution:**
Create cost layers by:
1. Creating a bill/purchase order for 83 tires @ estimated cost
2. Running an inventory adjustment with cost
3. Importing historical purchase data

---

### Scenario 4: Voiding an Invoice (Reversal)

**Initial State:**
- Invoice INV-004 was created and sent
- Consumed 8 units @ $40 = $320 COGS
- Product quantity reduced from 50 → 42 units

**Transaction:**
- Change invoice status to "void"

**System Actions:**
1. Find original inventory transactions for INV-004
2. For each consumed product:
   - Create new cost layer with returned quantity
   - Restore 8 units @ $40 = $320 to inventory
3. Update product quantity: 42 → 50 units
4. Create reversal COGS entry: DR Inventory $320, CR COGS $320
5. Mark invoice as void

**Financial Result:**
- Original revenue reversed
- Original COGS reversed
- Inventory quantity and value restored

---

### Scenario 5: Multi-Currency Invoice

**Initial State:**
- Product: Safari Tours
- Cost: UGX 500,000 per tour
- Selling Price: USD 150 per tour
- Exchange Rate: 1 USD = 3,700 UGX

**Transaction:**
- Sell 2 tours to international customer
- Invoice in USD, cost tracking in UGX

**System Actions:**
1. Convert selling price to base currency
   - USD 150 × 3,700 = UGX 555,000
2. Calculate COGS in base currency
   - 2 tours × UGX 500,000 = UGX 1,000,000
3. Record COGS journal entry in UGX
4. Create invoice in USD for customer
5. Revenue recognition in both currencies

**Financial Result (in UGX):**
- Revenue: UGX 1,110,000
- COGS: UGX 1,000,000
- **Gross Profit: UGX 110,000**

---

## Key Integration Points

### Code Files Involved:

#### 1. **`src/lib/accounting/inventory.ts`**
Core inventory logic:
- `isInventoryTracked()`: Check if product is tracked
- `consumeInventory()`: Consume from cost layers
- `processInvoiceInventory()`: Main entry point for invoices
- `createCOGSJournalEntry()`: Create COGS accounting entry
- `reverseInventoryConsumption()`: Handle voids/returns

#### 2. **`src/app/api/invoices/[id]/route.ts`**
API route that triggers inventory consumption:
```typescript
// When invoice status changes to sent/paid
const isBeingFinalized = 
  existing.status === 'draft' && 
  (body.status === 'sent' || body.status === 'paid');

if (isBeingFinalized) {
  const inventoryResult = await processInvoiceInventory(
    invoiceId,
    body.lines,
    existing.customer_id,
    user.id,
    supabase
  );
}
```

#### 3. **`src/app/dashboard/invoices/[id]/edit/page.tsx`**
Invoice edit form with status dropdown:
- Status change triggers API call
- Shows helper text: "Changing from Draft to Sent will deduct inventory"

#### 4. **`src/lib/accounting/general-ledger.ts`**
Journal entry creation:
- `createJournalEntry()`: Create accounting entries
- `postJournalEntry()`: Post entries to accounts

---

## Best Practices

### 1. Always Create Cost Layers
- Purchase inventory through bills/POs
- Don't manually adjust quantities without costs
- Use inventory adjustments with proper costing

### 2. Keep Status Workflow Consistent
- Draft → Sent/Paid (triggers inventory deduction)
- Void (triggers reversal)
- Don't skip directly to paid without deduction

### 3. Regular Reconciliation
- Compare quantity_on_hand with cost layer totals
- Verify COGS against actual purchases
- Run inventory valuation reports monthly

### 4. Choose Appropriate Costing Method
- **FIFO**: Most common, matches physical flow
- **LIFO**: Better for tax during inflation
- **Weighted Average**: Smooths volatility

### 5. Multi-Currency Handling
- Always convert to base currency for COGS
- Record exchange rates at transaction time
- Reconcile currency differences regularly

---

## Troubleshooting

### Problem: COGS = $0 on Invoice
**Cause**: No cost layers exist for product
**Solution**: Create bill/purchase order to establish cost basis

### Problem: Insufficient Inventory Error
**Cause**: Trying to sell more than available
**Solution**: Check quantity_on_hand, create purchase order

### Problem: COGS Doesn't Match Expected Value
**Cause**: Cost layers from different purchase prices
**Solution**: Review cost layers, verify valuation method (FIFO/LIFO)

### Problem: Inventory Quantity Correct but Value Wrong
**Cause**: Cost layers not properly consumed
**Solution**: Run inventory valuation report, verify layer consumption

### Problem: Void Invoice Doesn't Restore Inventory
**Cause**: Reversal function not called
**Solution**: Check invoice status change workflow

---

## Future Enhancements

### Planned Features:
1. **Landed Cost Allocation**: Add shipping/customs to inventory cost
2. **Lot/Serial Number Tracking**: Track specific units
3. **Multi-Location Transfers**: Move inventory between locations
4. **Inventory Aging Reports**: Identify slow-moving items
5. **Automatic Reorder Points**: Alert when stock is low
6. **Inventory Variance Tracking**: Cycle counts and adjustments
7. **Cost Layer History View**: UI to see all cost layers per product

---

## Summary

The COGS system in Sceneside provides:

✅ **Accurate Cost Tracking**: Every purchase creates cost layers
✅ **Automatic COGS Calculation**: FIFO/LIFO methods supported
✅ **Proper Accounting**: Journal entries for all transactions
✅ **Multi-Currency Support**: Convert currencies properly
✅ **Inventory Audit Trail**: Complete transaction history
✅ **Flexible Valuation Methods**: Choose FIFO, LIFO, or Weighted Average
✅ **Zero-Cost Fallback**: Allows legacy inventory to function

**Key Principle**: 
> "You can't sell what you don't know the cost of" - The system ensures every sale has proper COGS tracking for accurate financial reporting.

---

**Last Updated**: December 18, 2025  
**Version**: 1.0  
**Author**: Sceneside Development Team

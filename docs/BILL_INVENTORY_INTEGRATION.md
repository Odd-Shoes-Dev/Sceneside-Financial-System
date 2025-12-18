# Bill Inventory Integration Guide
## Sceneside L.L.C Financial System - Purchase to Inventory Flow

---

## Table of Contents
1. [Overview](#overview)
2. [The Purchase Lifecycle](#the-purchase-lifecycle)
3. [How Bill Inventory Works](#how-bill-inventory-works)
4. [Cost Layer Creation](#cost-layer-creation)
5. [Bill Approval Process](#bill-approval-process)
6. [Bill Voiding & Reversal](#bill-voiding--reversal)
7. [Integration Points](#integration-points)
8. [Code Implementation](#code-implementation)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The **Bill Inventory Integration** completes the purchase side of the inventory system. When you purchase inventory items from vendors, the system now:

✅ **Creates cost layers** - Tracks purchase costs for FIFO/LIFO COGS  
✅ **Updates inventory quantities** - Increases stock on hand  
✅ **Records transactions** - Full audit trail  
✅ **Posts accounting entries** - DR Inventory Asset, CR AP  

### Why This Matters:

**Before this integration:**
- Bills had product selection but didn't update inventory
- No cost layers were created
- Manual inventory adjustments needed
- COGS couldn't be calculated accurately

**After this integration:**
- Bills automatically receive inventory when approved
- Cost layers created for accurate COGS
- Inventory quantities update automatically
- Complete purchase-to-sale tracking

---

## The Purchase Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                 COMPLETE INVENTORY FLOW                  │
└─────────────────────────────────────────────────────────┘

STEP 1: PURCHASE (Bill Entry)
↓
Create Bill from Vendor
├─ Select Vendor
├─ Add Line Items
│   ├─ Select Product from dropdown
│   ├─ Auto-fills: Description, Cost Price
│   └─ Enter: Quantity
└─ Save as Draft

STEP 2: APPROVAL (Inventory Receipt)
↓
Approve Bill → Triggers processBillInventory()
├─ Creates Cost Layer
│   ├─ Product ID
│   ├─ Quantity Received: 100 units
│   ├─ Unit Cost: $25.00
│   ├─ Total Cost: $2,500
│   ├─ Received Date: 2025-12-18
│   └─ Reference: Bill #B-001
├─ Updates Inventory
│   ├─ product.quantity_on_hand: 0 → 100
│   └─ product_stock_locations: +100 at Main Warehouse
├─ Creates Transaction Record
│   ├─ Type: purchase
│   ├─ Quantity: +100
│   └─ Reference: Bill #B-001
└─ Creates Journal Entry
    DR Inventory Asset (1300)      $2,500
        CR Accounts Payable (2000)        $2,500

STEP 3: SALE (Invoice & COGS)
↓
Create Invoice → Send → Triggers processInvoiceInventory()
├─ Consumes Cost Layers (FIFO/LIFO)
│   ├─ Sell 17 units
│   ├─ Take from Cost Layer @ $25
│   └─ COGS = $425
├─ Updates Inventory
│   ├─ product.quantity_on_hand: 100 → 83
│   └─ cost_layer.remaining_quantity: 100 → 83
└─ Creates COGS Journal Entry
    DR Cost of Goods Sold (5100)   $425
        CR Inventory Asset (1300)         $425

RESULT: Accurate COGS & Inventory Tracking! ✅
```

---

## How Bill Inventory Works

### Product Selection in Bills

**Bills Now Work Like Invoices:**

| Field | Source | Behavior |
|-------|--------|----------|
| **Product** | Dropdown | Select from active products |
| **Description** | Auto-filled | From product.name |
| **Unit Price** | Auto-filled | From product.**cost_price** (purchase cost) |
| **Account Code** | Auto-set | 1300 (Inventory Asset) for physical_stock |
| **Quantity** | Manual entry | How many units purchased |

**Key Difference from Invoices:**
- **Bills** use `cost_price` (what you pay vendors)
- **Invoices** use `unit_price` (what customers pay you)

### When Inventory Processing Happens

**Inventory is received when bill status changes:**

```typescript
Draft → Approved ✅ Triggers processBillInventory()
Draft → Paid     ✅ Triggers processBillInventory()
Approved → Void  ✅ Triggers reverseBillInventory()
```

**Inventory is NOT processed for:**
- Draft bills (not yet confirmed)
- Bills without products (expense-only bills)
- Non-inventory products (services, tours)

---

## Cost Layer Creation

### What is a Cost Layer?

A **cost layer** is a record that tracks a specific purchase at a specific cost. It's used for FIFO/LIFO COGS calculation.

**Example: Multiple Purchases at Different Prices**

```
Purchase 1 (Jan 1):  50 tires @ $20 each = $1,000 → Layer 1
Purchase 2 (Feb 15): 50 tires @ $25 each = $1,250 → Layer 2
Purchase 3 (Mar 1):  50 tires @ $30 each = $1,500 → Layer 3
──────────────────────────────────────────────────────
Total Inventory:     150 tires              = $3,750
```

**When you sell 60 tires:**

**FIFO (First In, First Out):**
- Take 50 from Layer 1 @ $20 = $1,000
- Take 10 from Layer 2 @ $25 = $250
- **COGS = $1,250**

**LIFO (Last In, First Out):**
- Take 50 from Layer 3 @ $30 = $1,500
- Take 10 from Layer 2 @ $25 = $250
- **COGS = $1,750**

### Cost Layer Structure

```sql
CREATE TABLE inventory_cost_layers (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES inventory_locations(id),
  received_date DATE NOT NULL,
  quantity_received NUMERIC NOT NULL,    -- Initial quantity
  remaining_quantity NUMERIC NOT NULL,   -- What's left
  unit_cost NUMERIC NOT NULL,            -- Cost per unit
  total_cost NUMERIC NOT NULL,           -- quantity * unit_cost
  reference_type TEXT,                   -- 'bill'
  reference_id UUID,                     -- Bill ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Created by:** `processBillInventory()`  
**Consumed by:** `processInvoiceInventory()`

---

## Bill Approval Process

### Step-by-Step: What Happens When You Approve a Bill

#### **1. User Action**
```
Bills → Open Draft Bill → Click "Approve" Button
```

#### **2. Frontend Request**
```typescript
// src/app/dashboard/bills/[id]/page.tsx
const handleApprove = async () => {
  const response = await fetch(`/api/bills/${params.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  });
};
```

#### **3. API Processing**
```typescript
// src/app/api/bills/[id]/route.ts
export async function PATCH(request: NextRequest) {
  // Check if status changing: draft → approved
  const isBeingApproved = 
    existing.status === 'draft' && 
    body.status === 'approved';

  if (isBeingApproved) {
    // Process inventory!
    await processBillInventory(
      billId,
      billLines,
      billDate,
      userId,
      supabase
    );
  }
}
```

#### **4. Inventory Processing**
```typescript
// src/lib/accounting/inventory.ts
export async function processBillInventory(...) {
  for (each line with product_id) {
    // 1. Create cost layer
    await supabase.from('inventory_cost_layers').insert({
      product_id: line.product_id,
      received_date: billDate,
      quantity_received: line.quantity,
      remaining_quantity: line.quantity,
      unit_cost: line.unit_cost,
      reference_type: 'bill',
      reference_id: billId,
    });

    // 2. Update product quantity
    UPDATE products 
    SET quantity_on_hand = quantity_on_hand + line.quantity
    WHERE id = line.product_id;

    // 3. Create transaction record
    INSERT INTO inventory_transactions (
      product_id,
      transaction_type: 'purchase',
      quantity: +line.quantity,
      reference_type: 'bill'
    );

    // 4. Update location stock
    UPDATE product_stock_locations
    SET quantity_on_hand = quantity_on_hand + line.quantity;
  }

  // 5. Create journal entry
  await createJournalEntry({
    DR Inventory Asset (1300)
    CR Accounts Payable (2000)
  });
}
```

#### **5. Database Changes**

**Before Approval:**
```sql
-- products
quantity_on_hand: 0

-- inventory_cost_layers
(no records)

-- inventory_transactions
(no records)
```

**After Approval:**
```sql
-- products
quantity_on_hand: 100

-- inventory_cost_layers
id: layer-001
product_id: tire-001
quantity_received: 100
remaining_quantity: 100
unit_cost: 25.00
reference_type: 'bill'
reference_id: bill-123

-- inventory_transactions
product_id: tire-001
transaction_type: 'purchase'
quantity: 100
reference_type: 'bill'
reference_id: bill-123
```

---

## Bill Voiding & Reversal

### What Happens When You Void an Approved Bill

**Scenario:** You approved a bill, inventory was received, but now the purchase is cancelled.

#### **1. User Action**
```
Bills → Open Approved Bill → Click "Void" Button
```

#### **2. System Checks**
```typescript
// Can the inventory be reversed?
if (costLayer.remaining_quantity === costLayer.quantity_received) {
  // ✅ Nothing consumed yet - Safe to delete layer
  DELETE FROM inventory_cost_layers WHERE id = layer_id;
  
} else if (costLayer.remaining_quantity > 0) {
  // ⚠️ Partially consumed - Adjust layer
  UPDATE inventory_cost_layers
  SET quantity_received = remaining_quantity
  WHERE id = layer_id;
  
} else {
  // ❌ Fully consumed - Cannot reverse
  // Leave layer for historical record
}
```

#### **3. Reversal Actions**

**A. Delete or Adjust Cost Layer**
```sql
-- If not consumed yet
DELETE FROM inventory_cost_layers 
WHERE reference_id = bill_id;

-- If partially consumed
UPDATE inventory_cost_layers
SET quantity_received = remaining_quantity;
```

**B. Create Reversal Transaction**
```sql
INSERT INTO inventory_transactions (
  product_id,
  transaction_type: 'adjustment',
  quantity: -100,           -- Negative!
  reference_type: 'bill_void',
  reference_id: bill_id
);
```

**C. Reduce Product Quantity**
```sql
UPDATE products
SET quantity_on_hand = quantity_on_hand - 100
WHERE id = product_id;
```

**D. Create Reversal Journal Entry**
```
DR Accounts Payable (2000)     $2,500
    CR Inventory Asset (1300)         $2,500
```

### Reversal Scenarios

| Scenario | Cost Layer Action | Inventory Action | Result |
|----------|-------------------|------------------|--------|
| **Not yet sold** | Delete layer | Reduce quantity | ✅ Full reversal |
| **Partially sold** | Adjust layer | Reduce quantity | ⚠️ Partial reversal |
| **Fully sold** | Keep for history | Reduce quantity | ❌ Layer stays, qty adjusted |

---

## Integration Points

### Files Modified

#### **1. `src/lib/accounting/inventory.ts`**

**New Functions:**
```typescript
processBillInventory(
  billId: string,
  billLines: BillLine[],
  billDate: string,
  userId: string,
  supabase: SupabaseClient
) => Promise<InventoryReceiptResult>
```
- Creates cost layers
- Updates quantities
- Records transactions
- Creates journal entry

```typescript
reverseBillInventory(
  billId: string,
  userId: string
) => Promise<ReversalResult>
```
- Reverses inventory receipt
- Adjusts/deletes cost layers
- Creates reversal transactions

**Helper Function:**
```typescript
createInventoryReceiptJournalEntry(
  totalCost: number,
  billId: string,
  userId: string
) => Promise<string | undefined>
```
- Creates accounting entry for inventory receipt

---

#### **2. `src/app/api/bills/[id]/route.ts`**

**Imports Added:**
```typescript
import { 
  processBillInventory, 
  reverseBillInventory 
} from '@/lib/accounting/inventory';
```

**PATCH Endpoint Modified:**
```typescript
// Check for approval
const isBeingApproved = 
  existing.status === 'draft' && 
  body.status === 'approved';

if (isBeingApproved) {
  await processBillInventory(...);
}
```

**DELETE Endpoint Modified:**
```typescript
// Check for void
if (action === 'void' && existing.status === 'approved') {
  await reverseBillInventory(billId, userId);
}
```

---

#### **3. `src/app/dashboard/bills/[id]/page.tsx`**

**handleApprove() Updated:**
```typescript
// Changed from direct Supabase update
const { error } = await supabase
  .from('bills')
  .update({ status: 'approved' });

// To API route call
const response = await fetch(`/api/bills/${params.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'approved' }),
});
```

**Reason:** API route triggers inventory processing, Supabase direct doesn't.

---

#### **4. `src/app/dashboard/bills/new/page.tsx`**
#### **5. `src/app/dashboard/bills/[id]/edit/page.tsx`**

**Product Dropdown Added:**
```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;        // ✅ Fixed from unit_cost
  unit_price: number;
  inventory_category: string;
  currency: string;
}

// Fetch products
const { data } = await supabase
  .from('products')
  .select('id, name, sku, cost_price, ...')
  .eq('is_active', true);

// Auto-fill on selection
const handleProductChange = (id, productId) => {
  const product = products.find(p => p.id === productId);
  if (product) {
    setLineItem({
      product_id: productId,
      description: product.name,
      unit_price: product.cost_price,  // Purchase cost
      account_code: product.inventory_category === 'physical_stock' 
        ? '1300'  // Inventory Asset
        : '5100', // COGS
    });
  }
};
```

**UI Table Structure:**
```
| Product (Dropdown) | Description | Account | Qty | Price | Amount | Actions |
```

---

## Code Implementation

### Complete Function: processBillInventory()

```typescript
export async function processBillInventory(
  billId: string,
  billLines: {
    product_id: string | null;
    quantity: number;
    unit_cost: number;
    description?: string;
  }[],
  billDate: string,
  userId: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<{
  itemsReceived: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    costLayerId: string;
  }[];
  totalCost: number;
  journalEntryId?: string;
}> {
  const itemsReceived = [];
  let totalCost = new Decimal(0);

  // Get default location
  const { data: defaultLocation } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_default', true)
    .single();

  const locationId = defaultLocation?.id;

  // Process each line
  for (const line of billLines) {
    if (!line.product_id) continue;

    // Check if inventory tracked
    const tracked = await isInventoryTracked(line.product_id, supabase);
    if (!tracked) continue;

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('name, inventory_category')
      .eq('id', line.product_id)
      .single();

    if (!product) continue;

    const lineCost = new Decimal(line.quantity).times(line.unit_cost);

    // 1. Create cost layer
    const { data: costLayer } = await supabase
      .from('inventory_cost_layers')
      .insert({
        product_id: line.product_id,
        location_id: locationId,
        received_date: billDate,
        quantity_received: line.quantity,
        remaining_quantity: line.quantity,
        unit_cost: line.unit_cost,
        total_cost: lineCost.toNumber(),
        reference_type: 'bill',
        reference_id: billId,
      })
      .select()
      .single();

    // 2. Update product quantity
    const { data: currentProduct } = await supabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', line.product_id)
      .single();

    if (currentProduct) {
      await supabase
        .from('products')
        .update({
          quantity_on_hand: (currentProduct.quantity_on_hand || 0) + line.quantity,
        })
        .eq('id', line.product_id);
    }

    // 3. Create transaction record
    await supabase.from('inventory_transactions').insert({
      product_id: line.product_id,
      location_id: locationId,
      transaction_type: 'purchase',
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      total_cost: lineCost.toNumber(),
      reference_type: 'bill',
      reference_id: billId,
      notes: `Received from bill ${billId}`,
    });

    // 4. Update location stock
    if (locationId) {
      const { data: locationStock } = await supabase
        .from('product_stock_locations')
        .select('quantity_on_hand')
        .eq('product_id', line.product_id)
        .eq('location_id', locationId)
        .single();

      if (locationStock) {
        await supabase
          .from('product_stock_locations')
          .update({
            quantity_on_hand: locationStock.quantity_on_hand + line.quantity,
          })
          .eq('product_id', line.product_id)
          .eq('location_id', locationId);
      } else {
        await supabase
          .from('product_stock_locations')
          .insert({
            product_id: line.product_id,
            location_id: locationId,
            quantity_on_hand: line.quantity,
            quantity_reserved: 0,
          });
      }
    }

    itemsReceived.push({
      productId: line.product_id,
      productName: product.name,
      quantity: line.quantity,
      unitCost: line.unit_cost,
      totalCost: lineCost.toNumber(),
      costLayerId: costLayer.id,
    });

    totalCost = totalCost.plus(lineCost);
  }

  // 5. Create journal entry
  let journalEntryId: string | undefined;
  if (totalCost.greaterThan(0)) {
    journalEntryId = await createInventoryReceiptJournalEntry(
      totalCost.toNumber(),
      billId,
      userId
    );
  }

  return {
    itemsReceived,
    totalCost: totalCost.toNumber(),
    journalEntryId,
  };
}
```

---

## Testing Guide

### Test Case 1: Create Bill and Approve

**Objective:** Verify cost layers are created when bill is approved

**Steps:**
1. Navigate to Bills → New Bill
2. Select vendor: "ABC Supplies"
3. Add line item:
   - Select Product: "Tires" from dropdown
   - Verify description auto-fills: "Tires"
   - Verify unit price auto-fills from cost_price
   - Enter quantity: 100
4. Click "Create Bill"
5. Open the created bill
6. Click "Approve" button
7. Confirm approval dialog

**Expected Results:**
✅ Success message: "Bill approved and inventory received successfully!"  
✅ Bill status changes to "approved"  
✅ Console log shows: "Inventory received: { itemsReceived: [...], totalCost: 2500 }"

**Verify in Database:**
```sql
-- Check cost layer created
SELECT * FROM inventory_cost_layers
WHERE reference_type = 'bill' 
AND reference_id = '[BILL_ID]';

Expected:
- quantity_received: 100
- remaining_quantity: 100
- unit_cost: 25.00
- total_cost: 2500.00

-- Check product quantity updated
SELECT quantity_on_hand FROM products
WHERE name = 'Tires';

Expected: 100 (or previous + 100)

-- Check transaction recorded
SELECT * FROM inventory_transactions
WHERE reference_type = 'bill'
AND reference_id = '[BILL_ID]';

Expected:
- transaction_type: 'purchase'
- quantity: 100
```

---

### Test Case 2: Create Invoice to Consume Inventory

**Objective:** Verify cost layers are consumed and COGS calculated

**Prerequisites:** Cost layer exists from Test Case 1

**Steps:**
1. Navigate to Invoices → New Invoice
2. Select customer
3. Add line item:
   - Select Product: "Tires"
   - Enter quantity: 17
   - Unit price: $50.00
4. Save and change status to "Sent"

**Expected Results:**
✅ Invoice created successfully  
✅ Console log shows COGS calculation

**Verify in Database:**
```sql
-- Check cost layer consumed
SELECT remaining_quantity FROM inventory_cost_layers
WHERE reference_type = 'bill'
AND reference_id = '[BILL_ID]';

Expected: 83 (100 - 17)

-- Check product quantity reduced
SELECT quantity_on_hand FROM products
WHERE name = 'Tires';

Expected: 83

-- Check COGS transaction
SELECT * FROM inventory_transactions
WHERE reference_type = 'invoice'
AND transaction_type = 'sale';

Expected:
- quantity: -17
- unit_cost: 25.00
- total_cost: -425.00 (17 × 25)

-- Check COGS journal entry
SELECT * FROM journal_entry_lines jel
JOIN accounts a ON a.id = jel.account_id
WHERE a.code = '5100';  -- COGS account

Expected:
- debit: 425.00
```

---

### Test Case 3: Void Approved Bill

**Objective:** Verify inventory reversal when bill is voided

**Prerequisites:** Approved bill with inventory

**Steps:**
1. Open approved bill
2. Click "Void" button
3. Confirm void action

**Expected Results:**
✅ Bill status changes to "void"  
✅ Console log shows: "Inventory reversed: { reversed: true }"

**Verify in Database:**
```sql
-- If not yet consumed
SELECT * FROM inventory_cost_layers
WHERE reference_id = '[BILL_ID]';

Expected: No records (deleted)

-- If partially consumed
SELECT quantity_received, remaining_quantity 
FROM inventory_cost_layers
WHERE reference_id = '[BILL_ID]';

Expected: quantity_received = remaining_quantity

-- Check reversal transaction
SELECT * FROM inventory_transactions
WHERE reference_type = 'bill_void';

Expected:
- transaction_type: 'adjustment'
- quantity: -100 (negative)

-- Check product quantity reduced
SELECT quantity_on_hand FROM products
WHERE name = 'Tires';

Expected: Reduced by voided quantity
```

---

### Test Case 4: Multi-Product Bill

**Objective:** Verify multiple products are handled correctly

**Steps:**
1. Create bill with 3 different products:
   - Tires: 50 units @ $25
   - Oil: 20 gallons @ $5
   - Filters: 100 units @ $3
2. Approve bill

**Expected Results:**
✅ 3 cost layers created  
✅ All 3 products have updated quantities  
✅ 3 transaction records created  
✅ Journal entry total = $50 + $100 + $300 = $1,450

---

### Test Case 5: Non-Inventory Bill

**Objective:** Verify bills without products work normally

**Steps:**
1. Create bill for office rent (expense, no product)
2. Approve bill

**Expected Results:**
✅ Bill approved successfully  
✅ No cost layers created  
✅ No inventory transactions  
✅ Journal entry only has expense DR and AP CR

---

## Troubleshooting

### Problem: No cost layers created when bill approved

**Possible Causes:**
1. Product not inventory tracked
2. Product has `track_inventory = false`
3. Product `inventory_category` is not `physical_stock`
4. Line item has no `product_id`

**Solution:**
```sql
-- Check product settings
SELECT 
  id, 
  name, 
  track_inventory, 
  inventory_category
FROM products
WHERE id = '[PRODUCT_ID]';

-- Fix if needed
UPDATE products
SET 
  track_inventory = true,
  inventory_category = 'physical_stock'
WHERE id = '[PRODUCT_ID]';
```

---

### Problem: "column products.unit_cost does not exist"

**Cause:** Using wrong field name (should be `cost_price`)

**Solution:**
```typescript
// ❌ Wrong
.select('id, name, unit_cost, ...')

// ✅ Correct
.select('id, name, cost_price, ...')

// In usage
convertedPrice = product.cost_price || product.unit_price
```

---

### Problem: Approval button doesn't trigger inventory processing

**Cause:** Using direct Supabase update instead of API route

**Solution:**
```typescript
// ❌ Wrong - bypasses API logic
const { error } = await supabase
  .from('bills')
  .update({ status: 'approved' })
  .eq('id', billId);

// ✅ Correct - goes through API
const response = await fetch(`/api/bills/${billId}`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'approved' }),
});
```

---

### Problem: Quantity increased but no cost layer

**Cause:** Error in cost layer creation (check console)

**Check Console:**
```
Failed to create cost layer for product xxx: [ERROR]
```

**Common Issues:**
- Missing required fields in insert
- Foreign key violation (invalid location_id)
- Permission issues (RLS policies)

**Debug:**
```typescript
// Add logging
const { data: costLayer, error: layerError } = await supabase
  .from('inventory_cost_layers')
  .insert({...});

if (layerError) {
  console.error('Cost layer error:', layerError);
}
```

---

### Problem: Void doesn't reverse inventory

**Cause:** Bill status check fails

**Solution:**
```typescript
// Make sure to check current status
const { data: existing } = await supabase
  .from('bills')
  .select('status, amount_paid')
  .eq('id', billId)
  .single();

// Only reverse if was approved
if (existing.status === 'approved') {
  await reverseBillInventory(billId, userId);
}
```

---

### Problem: Inventory negative after reversal

**Cause:** Trying to reverse more than available

**Prevention:**
```typescript
// Use Math.max to prevent negative
UPDATE products
SET quantity_on_hand = GREATEST(0, quantity_on_hand - reversed_qty)
WHERE id = product_id;
```

---

## Best Practices

### 1. Always Use the Product Dropdown
- ✅ Links purchase to product
- ✅ Creates cost layers automatically
- ✅ Enables COGS calculation
- ❌ Don't manually type product names

### 2. Approve Bills Only When Inventory Received
- Bills should be approved when goods physically arrive
- Draft status = order placed, not yet received
- Approved status = goods received, inventory updated

### 3. Check Product Settings
```sql
-- Ensure products are set up correctly
UPDATE products
SET 
  track_inventory = true,
  inventory_category = 'physical_stock',
  cost_price = [ACTUAL_COST]
WHERE id = '[PRODUCT_ID]';
```

### 4. Verify Before Voiding
- Check if inventory has been sold
- Consider adjustments instead of voiding
- Document reasons for voiding

### 5. Monitor Cost Layers
```sql
-- View all cost layers for a product
SELECT 
  received_date,
  quantity_received,
  remaining_quantity,
  unit_cost,
  reference_type,
  reference_id
FROM inventory_cost_layers
WHERE product_id = '[PRODUCT_ID]'
ORDER BY received_date;
```

---

## Summary

### What This Integration Provides:

✅ **Complete Purchase Tracking**
- Bills now fully integrated with inventory
- Cost layers created automatically
- Full audit trail maintained

✅ **Accurate COGS Calculation**
- Purchase costs tracked at time of receipt
- FIFO/LIFO methods use actual historical costs
- No manual adjustments needed

✅ **Proper Accounting**
- Inventory asset account updated correctly
- AP entries match inventory receipts
- Journal entries auto-created

✅ **User-Friendly Interface**
- Product dropdown just like invoices
- Auto-fills cost price
- Clear approval workflow

✅ **Reversibility**
- Void approved bills safely
- Inventory adjustments automatic
- Cost layers properly handled

---

### The Complete Flow:

```
Bill Created (Draft)
    ↓
Bill Approved
    ↓
Cost Layer Created
    ↓
Inventory Quantity Increased
    ↓
Transaction Recorded
    ↓
Journal Entry Posted
    ↓
Ready for Sale
    ↓
Invoice Created & Sent
    ↓
Cost Layer Consumed (FIFO/LIFO)
    ↓
COGS Calculated
    ↓
Inventory Quantity Decreased
    ↓
Profit = Revenue - COGS ✅
```

---

**Last Updated:** December 18, 2025  
**Version:** 1.0  
**System:** Sceneside L.L.C Financial System  
**Related Docs:** 
- [INVENTORY_COGS_SYSTEM.md](./INVENTORY_COGS_SYSTEM.md)
- [INVENTORY_SYSTEM_GUIDE.md](./INVENTORY_SYSTEM_GUIDE.md)

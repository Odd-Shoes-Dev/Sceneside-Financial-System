# Zero-Cost Inventory Warning Implementation

**Date:** December 20, 2025  
**Feature:** Warning system for products without cost layers

---

## Overview

Implemented three key features to address zero-cost inventory consumption:

1. **Warning Modal on Invoice "Mark as Sent"** - Alerts users before processing invoices with products that have no cost layers
2. **Inventory Dashboard Badges** - Visual indicators showing products with quantity but no cost layers
3. **Product Detail Page Alert** - Clear warning on individual product pages when cost layers are missing

---

## Files Created/Modified

### New API Endpoints

1. **`/src/app/api/invoices/[id]/check-cost-layers/route.ts`**
   - Checks if an invoice has products without cost layers
   - Returns list of zero-cost products with details
   - Called before marking invoice as sent

2. **`/src/app/api/inventory/zero-cost-check/route.ts`**
   - Global check for all products with quantity but no cost layers
   - Returns count and list of affected products
   - Used by inventory dashboard

### Modified Files

3. **`/src/app/dashboard/invoices/[id]/page.tsx`**
   - Added `ConfirmModal` import from UI components
   - Added state for zero-cost warning modal
   - Modified `handleMarkAsSent()` to check cost layers first
   - Added `proceedWithMarkAsSent()` for actual status update
   - Added warning modal UI at bottom of component

4. **`/src/app/dashboard/inventory/page.tsx`**
   - Added state for tracking zero-cost products
   - Added `loadZeroCostCheck()` function
   - Added 5th summary card showing "No Cost Layers" count
   - Added badge indicator next to products without cost layers in table
   - Badge shows warning icon and "No Cost" text

5. **`/src/app/dashboard/inventory/[id]/page.tsx`**
   - Added `hasCostLayers` state and loading state
   - Added `checkCostLayers()` function to check specific product
   - Added amber "No Cost Layers" badge below product status
   - Added prominent alert box with warning details and action guidance
   - Only displays for inventory-tracked products with quantity > 0

---

## How It Works

### Invoice Flow

```
User clicks "Mark as Sent"
    ↓
Check cost layers via API
    ↓
If zero-cost products found
    ↓
Show warning modal with:
  - Product names
  - SKUs
  - Quantities
  - Warning message
    ↓
User chooses:
  - Cancel → Return to invoice
  - Continue → Proceed with $0 COGS
```

### Inventory Dashboard

```
Page Load
    ↓
Fetch zero-cost product count
    ↓
Display in summary card (amber highlight)
    ↓
Show badge next to affected products:
  - Amber background
  - Warning icon
  - "No Cost" text
  - Tooltip: "No cost layers available - will invoice at $0 COGS"
```

### Product Detail Page

```
Page Load
    ↓
Fetch product details
    ↓
Check cost layers for this product
    ↓
If no cost layers AND quantity > 0:
  - Show amber badge below status
  - Display alert box with:
    • Warning icon
    • Clear explanation
    • Current stock quantity
    • Impact on COGS
    • Action required message
```

---

## Database Queries

### Check Invoice Cost Layers
```typescript
// Get invoice lines with product details
SELECT 
  invoice_lines.product_id,
  invoice_lines.quantity,
  products.name,
  products.sku,
  products.track_inventory,
  products.inventory_category
FROM invoice_lines
JOIN products ON invoice_lines.product_id = products.id
WHERE invoice_lines.invoice_id = ?

// For each product, check cost layers
SELECT quantity_remaining
FROM inventory_cost_layers
WHERE product_id = ? 
  AND quantity_remaining > 0
```

### Check All Zero-Cost Products
```typescript
// Get all active tracked products
SELECT id, name, sku, quantity_on_hand, track_inventory, inventory_category
FROM products
WHERE is_active = true

// For products with quantity > 0, check cost layers
SELECT quantity_remaining
FROM inventory_cost_layers
WHERDetailed alert on product detail page
- ✅ E product_id = ? 
  AND quantity_remaining > 0
```

---

## User Experience

### Before Implementation
- ❌ Silent zero-cost consumption
- ❌ Only console warnings (not visible to users)
- ❌ No way to identify problematic products
- ❌ Potential profit margin issues

### After Implementation
- ✅ Clear warning modal before invoice sent
- ✅ Inventory dashboard shows affected products
- ✅ Summary card with count of zero-cost items
- ✅ Visual badges on product rows
- ✅ User can make informed decision

---

## Modal Design

**Warning Modal Properties:**
- **Title:** "⚠️ Products Without Cost Layers"
- **Variant:** Warning (amber color scheme)
- **Message:** Lists affected products with SKUs and quantities
- **Actions:**
  - Cancel (return to invoice)
  - Continue Anyway (proceed with $0 COGS)
- **Loading State:** Shows spinner during processing

**Example Message:**
```
The following products have no cost layers and will be invoiced with $0 COGS:

• Tires (SKU-001) - Qty: 4
• Oil Filter (SKU-023) - Qty: 2

This means no inventory cost will be recorded, potentially affecting your profit margins.

Do you want to continue?
```

---

## Inventory Dashboard Features

### Summary Card
- **Position:** 5th card in summary grid
- **Styling:** Amber border and background for visibility
- **Icon:** Warning triangle
- **Content:** 
  - Count of zero-cost products
  - Subtitle: "Products will invoice at $0 COGS"

### Product Table Badge
- **Position:** Next to product name
- **Design:** 
  - Amber pill badge
  - Warning icon
  - "No Cost" text
- **Tooltip:** Explains the issue

---

## Product Detail Page Alert

### Alert Box Design
- **Position:** Below status badges, above summary cards
- **Styling:** 
  - Amber background (bg-amber-50)
  - Left border (border-l-4 border-amber-500)
  - Rounded corners
- **Layout:**
  - Warning triangle icon (left)
  - Content area (right)
  
### Content Structure
1. **Title:** "No Cost Layers Available" (bold, amber-900)
2. **Description:** Explains the issue with current stock quantity
3. **Impact Statement:** "$0 COGS" warning and profit margin note
4. **Action Required:** Clear guidance on what to do

### Product Detail Page
- [ ] Product with cost layers → No warning shown
- [ ] Product without cost layers but no quantity → No warning shown
- [ ] Product with quantity but no cost layers → Shows badge AND alert box
- [ ] Alert box displays current stock quantity correctly
- [ ] Alert box provides clear action guidance
- [ ] Badge appears next to status badge
- [ ] Non-tracked products → No warnings (tours, services, etc.)

### Edge Cases
- [ ] Invoice with no inventory products → No warning
- [ ] Product with partial cost layers (insufficient quantity) → Shows warning
- [ ] Tour products / non-tracked items → Excluded from check
- [ ] Empty inventory → Zero-cost card shows 0
- [ ] Loading states display correctly on product detail pagelayers. Invoicing 
this product will result in $0 COGS, which may affect your profit 
margins and financial reporting.

Action required: Create a bill or inventory adjustment to establish 
cost layers.
```

### Badge Display
- **Position:** Next to status badge (In Stock, Low Stock, etc.)
- **Design:**
  - Amber badge with border
  - Warning icon
  - "No Cost Layers" text
- **Conditions:**
  - Product tracks inventory
  - Quantity on hand > 0
  - No cost layers available
- **Only shows:** When product has quantity but no cost layers

---

## Testing Checklist

### Invoice Warning
- [ ] Create invoice with product that has cost layers → No warning
- [ ] Create invoice with product without cost layers → Warning shows
- [ ] Mixed invoice (some with, some without) → Warning lists only zero-cost products
- [ ] Click "Cancel" on warning → Returns to invoice detail page
- [ ] Click "Continue Anyway" → Invoice marked as sent, inventory consumed
- [ ] Check console for COGS journal entry (should be $0)

### Inventory Dashboard
- [ ] Product with quantity and cost layers → No badge
- [ ] Product with quantity but no cost layers → Shows amber "No Cost" badge
- [ ] Summary card shows correct count of zero-cost products
- [ ] Badge tooltip displays on hover
- [ ] Badge appears in both desktop table and mobile cards

### Edge Cases
- [ ] Invoice with no inventory products → No warning
- [ ] Product with partial cost layers (insufficient quantity) → Shows warning
- [ ] Tour products / non-tracked items → Excluded from check
- [ ] Empty inventory → Zero-cost card shows 0

---

## Future Enhancements

1. **Prevent Zero-Cost Invoicing (Optional)**
   - Add setting to block invoicing products without cost layers
   - Force users to add purchase/adjustment first

2. **Bulk Cost Layer Creation**
   - Button to quickly add cost layers for flagged products
   - Import from historical bills

3. **Email Notifications**
   - Daily/weekly report of products without cost layers
   - Alert accountants automatically

4. **Low Cost Layer Warning**
   - Warn when cost layers are running low (not just zero)
   - Predictive alerts based on sales velocity

---

## Related Files

- Invoice Processing: `/src/lib/accounting/inventory.ts`
- Cost Layers Migration: `/supabase/migrations/025_inventory_cost_layers.sql`
- Modal Component: `/src/components/ui/modal.tsx`
- Testing Checklist: `/docs/TESTING_CHECKLIST.md`

---

## Notes

- The system still allows zero-cost consumption (by design) but with user acknowledgment
- Cost layer checking is performed real-time (no caching)
- Warning modal uses existing `ConfirmModal` component from UI library
- Dashboard badge uses consistent design system colors (amber for warnings)
- All checks only apply to inventory-tracked products (`track_inventory = true` or `inventory_category = 'physical_stock'`)

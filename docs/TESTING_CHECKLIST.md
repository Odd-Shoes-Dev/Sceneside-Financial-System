# Testing Checklist - Sceneside Financial System

## Status Legend
- ✅ Tested & Working
- ⚠️ Partially Tested
- ❌ Not Tested
- 🚧 In Progress
- N/A Not Applicable

---

## Inventory & COGS System

### Core Inventory Flow ✅
- [x] Bill approval creates cost layers
- [x] Bill approval increases inventory quantity
- [x] Invoice "Mark as Sent" consumes cost layers (FIFO)
- [x] Invoice "Mark as Sent" decreases inventory quantity
- [x] COGS journal entry created (DR 5000 COGS, CR 1300 Inventory)
- [x] P&L Report shows COGS in Cost of Sales section

### Inventory Reversal Operations ✅
- [x] **Invoice Voiding** - Reverse inventory consumption
  - [x] Restores inventory quantity
  - [x] Restores cost layers (adds back consumed quantities)
  - [x] Creates reversal COGS journal entry (DR 1300, CR 5000)
  - [ ] Updates P&L report correctly
  
- [ ] **Bill Voiding** - Reverse inventory increase
  - [ ] Decreases inventory quantity
  - [ ] Removes/adjusts cost layers created
  - [ ] Creates reversal journal entries if needed
  - [ ] Updates inventory valuation

### Cost Layer Consumption ❌
- [ ] **Cost Layer Depletion (FIFO)**
  - [ ] Invoice quantity fully consumes first cost layer
  - [ ] Automatically moves to next cost layer
  - [ ] Correctly tracks remaining quantities in each layer
  - [ ] Journal entry reflects blended cost from multiple layers

- [ ] **LIFO Valuation Method**
  - [ ] Change product valuation method to LIFO
  - [ ] Verify it consumes from newest cost layers first
  - [ ] COGS calculation uses correct layer order

- [ ] **Average Cost Valuation**
  - [ ] Change product valuation method to Average Cost
  - [ ] Verify average cost calculation
  - [ ] COGS uses average unit cost

### Multiple Products ❌
- [ ] **Invoice with Multiple Products**
  - [ ] Create invoice with 2-3 different inventory products
  - [ ] Verify each product's cost layers consumed correctly
  - [ ] COGS calculated separately for each product
  - [ ] Total COGS = sum of all products' costs
  - [ ] Journal entry has correct total amount

### Edge Cases ❌
- [ ] **Insufficient Inventory**
  - [ ] Try to invoice more quantity than available
  - [ ] System prevents or warns about overselling
  - [ ] Partial fulfillment handling

- [ ] **Zero-Cost Inventory**
  - [ ] Invoice a product with no cost layers
  - [ ] Verify graceful handling (COGS = $0)
  - [ ] No errors thrown

- [ ] **Negative Inventory**
  - [ ] Test what happens if inventory goes negative
  - [ ] Verify system behavior/prevention

### Manual Inventory Operations ❌
- [ ] **Manual Inventory Adjustments**
  - [ ] Adjust inventory quantity up (add stock)
  - [ ] Adjust inventory quantity down (remove stock)
  - [ ] Create cost layer on adjustment up
  - [ ] Consume cost layers on adjustment down
  - [ ] Journal entries created for adjustments

- [ ] **Location Transfers**
  - [ ] Transfer inventory between locations
  - [ ] Cost layers move with inventory
  - [ ] Quantities update correctly at both locations

### Inventory Reports ❌
- [ ] **Inventory Valuation Report**
  - [ ] Shows total inventory value by product
  - [ ] Reflects current cost layers
  - [ ] Matches balance sheet inventory account

- [ ] **Inventory Transactions Report**
  - [ ] Lists all inventory movements
  - [ ] Shows purchases, sales, adjustments
  - [ ] Filterable by date, product, location

---

## Journal Entries & Posting

### Journal Entry Creation ⚠️
- [x] Create manual journal entry
- [x] System-generated journal entries (COGS)
- [ ] **Post Journal Entry**
  - [ ] Draft → Posted status change
  - [ ] Updates account balances
  - [ ] Reflects in Trial Balance
  - [ ] Reflects in Balance Sheet
  - [ ] Cannot be edited after posting

- [ ] **Void Journal Entry**
  - [ ] Posted → Void status change
  - [ ] Creates reversal entry
  - [ ] Account balances reversed

---

## Document Editing & Modification

### Bills ❌
- [ ] **Edit Draft Bill**
  - [ ] Modify quantities
  - [ ] Add/remove line items
  - [ ] Change vendor
  - [ ] Totals recalculate correctly

- [ ] **Edit Approved Bill** (if allowed)
  - [ ] System prevents editing or creates amendment
  - [ ] Inventory adjustments if quantities change

### Invoices ❌
- [ ] **Edit Draft Invoice**
  - [ ] Modify quantities
  - [ ] Add/remove line items
  - [ ] Change customer
  - [ ] Totals recalculate correctly

- [ ] **Edit Sent Invoice** (if allowed)
  - [ ] System prevents editing or creates credit note
  - [ ] Inventory adjustments if quantities change

---

## Financial Reports

### Profit & Loss Statement ⚠️
- [x] Revenue section displays correctly
- [x] Cost of Sales section displays correctly (accounts 5000-5499)
- [x] Operating Expenses section displays correctly
- [x] Gross Profit calculation correct
- [x] Net Income calculation correct
- [ ] Date range filtering works
- [ ] Comparison periods work
- [ ] Export to PDF/Excel

### Balance Sheet ❌
- [ ] Assets section displays correctly
- [ ] Inventory (1300) reflects current valuation
- [ ] Liabilities section displays correctly
- [ ] Equity section displays correctly
- [ ] Balance equation: Assets = Liabilities + Equity
- [ ] Date filtering works
- [ ] Export to PDF/Excel

### Trial Balance ⚠️
- [x] All accounts listed
- [x] Debit/Credit columns
- [ ] Posted journal entries update balances
- [ ] Totals balance (Total Debits = Total Credits)
- [ ] Date filtering works

### Accounts Receivable Aging ⚠️
- [x] Customer balances display
- [x] Aging buckets (Current, 30, 60, 90+ days)
- [ ] Excludes fully paid invoices
- [ ] Updates when payments received

### Accounts Payable Aging ⚠️
- [x] Vendor balances display
- [x] Aging buckets (Current, 30, 60, 90+ days)
- [ ] Excludes fully paid bills
- [ ] Updates when payments made

---

## Multi-Currency Operations ❌

### Currency Exchange
- [ ] **Bill in Foreign Currency**
  - [ ] Create bill in EUR/GBP/etc.
  - [ ] Exchange rate applied
  - [ ] Cost layer created in USD equivalent
  - [ ] Inventory value in base currency

- [ ] **Invoice in Foreign Currency**
  - [ ] Create invoice in EUR/GBP/etc.
  - [ ] Exchange rate applied
  - [ ] COGS calculated in base currency
  - [ ] Revenue recorded in base currency

- [ ] **Exchange Rate Management**
  - [ ] Manual exchange rate entry
  - [ ] Exchange rate by date
  - [ ] Historical rates maintained

---

## Payments & Banking

### Customer Payments ❌
- [ ] Record payment for invoice
- [ ] Partial payment handling
- [ ] Overpayment handling
- [ ] Multiple invoices in one payment
- [ ] Payment methods (Cash, Check, Card, ACH)
- [ ] Bank reconciliation

### Vendor Payments ❌
- [ ] Record payment for bill
- [ ] Partial payment handling
- [ ] Multiple bills in one payment
- [ ] Payment methods
- [ ] Bank reconciliation

### Bank Transactions ❌
- [ ] Import bank transactions
- [ ] Match transactions to payments
- [ ] Categorize unmatched transactions
- [ ] Bank reconciliation report

---

## User Management & Permissions

### User Roles ❌
- [ ] **Viewer Role**
  - [ ] Can view reports only
  - [ ] Cannot create/edit documents
  
- [ ] **Manager Role**
  - [ ] Can create invoices/bills
  - [ ] Cannot approve without accountant review
  
- [ ] **Accountant Role**
  - [ ] Full accounting access
  - [ ] Can post journal entries
  - [ ] Can approve bills/invoices
  
- [ ] **Admin Role**
  - [ ] Full system access
  - [ ] User management
  - [ ] Settings management

### Activity Logging ❌
- [ ] User actions logged
- [ ] Audit trail for financial documents
- [ ] Changes tracked with timestamps

---

## Advanced Features

### Returns Processing ❌
- [ ] **Customer Returns**
  - [ ] Create credit note/return
  - [ ] Restore inventory
  - [ ] Create new cost layer for returned items
  - [ ] Reverse COGS

- [ ] **Vendor Returns**
  - [ ] Return items to vendor
  - [ ] Decrease inventory
  - [ ] Remove cost layers
  - [ ] Adjust AP balance

### Product Bundles/Kits ❌
- [ ] Create product bundle
- [ ] Invoice bundle as single item
- [ ] Consume inventory for all bundle components
- [ ] COGS calculated for all components

### Scheduled Reports ❌
- [ ] Set up scheduled report email
- [ ] Report generated and sent on schedule
- [ ] Configurable frequency (daily, weekly, monthly)
- [ ] Multiple recipients

---

## Website & CMS Features

### Tour Management ❌
- [ ] Create tour product
- [ ] Set capacity and schedule
- [ ] Book tour through invoice
- [ ] Capacity tracking (not physical inventory)

### Website Content ❌
- [ ] Manage website pages
- [ ] Image gallery management
- [ ] Tours display on website
- [ ] Contact form submissions
- [ ] Tour booking requests

---

## Data Integrity & Edge Cases

### Data Validation ❌
- [ ] Prevent negative quantities (where appropriate)
- [ ] Prevent posting unbalanced journal entries
- [ ] Prevent editing posted documents
- [ ] Required field validation
- [ ] Duplicate detection (invoice numbers, etc.)

### Error Handling ❌
- [ ] Database connection errors
- [ ] Invalid data submission
- [ ] Concurrent editing conflicts
- [ ] Permission denied scenarios
- [ ] User-friendly error messages

### Performance ❌
- [ ] Large dataset handling (1000+ invoices)
- [ ] Report generation with extensive data
- [ ] Search/filter performance
- [ ] Page load times

---

## Testing Priority

### Phase 1: Critical (Do First)
1. Invoice Voiding
2. Bill Voiding
3. Multiple Products per Invoice
4. Cost Layer Depletion (FIFO)
5. Post Journal Entries & Account Balance Updates
6. Balance Sheet Report

### Phase 2: Important (Do Second)
7. Manual Inventory Adjustments
8. Insufficient Inventory Handling
9. LIFO and Average Cost Methods
10. Customer Payments
11. Vendor Payments
12. Inventory Valuation Report

### Phase 3: Common Use Cases (Do Third)
13. Edit Draft Bills/Invoices
14. Multi-currency Operations
15. Bank Reconciliation
16. Trial Balance with Posted Entries
17. Customer/Vendor Returns

### Phase 4: Advanced (Do Last)
18. User Role Permissions
19. Product Bundles
20. Scheduled Reports
21. Performance Testing
22. Tour Management Integration

---

## Current Status Summary

**Completed (6):**
- Bill approval with inventory increase ✅
- Invoice processing with COGS calculation ✅
- Cost layer creation (FIFO) ✅
- P&L Report COGS display ✅
- AP/AR Aging Reports ✅
- Trial Balance display ✅

**Next Priority:**
1. Invoice Voiding - Critical for production use
2. Post Journal Entries - Verify account balances update
3. Balance Sheet Report - Ensure inventory asset reflects correctly
4. Multiple Products - Common scenario testing

**Estimated Testing Time:**
- Phase 1: 3-4 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 5-6 hours
- **Total: ~16-20 hours of thorough testing**

---

## Notes

- All tests should be performed in a test environment/company before production
- Document any bugs found with steps to reproduce
- Create GitHub issues for bugs that need fixing
- Update this checklist as features are tested

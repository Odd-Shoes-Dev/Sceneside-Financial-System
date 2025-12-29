# Sceneside L.L.C - Complete User Manual

**Version:** 1.0  
**Last Updated:** December 23, 2025  
**System:** Sceneside Integrated Business Management System

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Setting Up Your Business](#4-setting-up-your-business)
   - 4.1 [Company Settings](#41-company-settings)
   - 4.2 [Creating Bank Accounts](#42-creating-bank-accounts)
   - 4.3 [Chart of Accounts](#43-chart-of-accounts)
5. [Managing Customers](#5-managing-customers)
6. [Managing Vendors](#6-managing-vendors)
7. [Inventory Management](#7-inventory-management)
   - 7.1 [Adding Products](#71-adding-products)
   - 7.2 [Inventory Categories](#72-inventory-categories)
   - 7.3 [Cost Tracking (FIFO)](#73-cost-tracking-fifo)
8. [Creating Invoices (Sales)](#8-creating-invoices-sales)
   - 8.1 [Creating a New Invoice](#81-creating-a-new-invoice)
   - 8.2 [Sending Invoices](#82-sending-invoices)
   - 8.3 [Invoice Statuses](#83-invoice-statuses)
   - 8.4 [Voiding Invoices](#84-voiding-invoices)
9. [Creating Bills (Purchases)](#9-creating-bills-purchases)
   - 9.1 [Creating a New Bill](#91-creating-a-new-bill)
   - 9.2 [Approving Bills](#92-approving-bills)
   - 9.3 [Voiding Bills](#93-voiding-bills)
10. [Recording Expenses](#10-recording-expenses)
11. [Creating Receipts](#11-creating-receipts)
12. [Bank Management](#12-bank-management)
    - 12.1 [Recording Transactions](#121-recording-transactions)
    - 12.2 [Bank Transfers](#122-bank-transfers)
    - 12.3 [Reconciliation](#123-reconciliation)
13. [Journal Entries](#13-journal-entries)
14. [Financial Reports](#14-financial-reports)
15. [Multi-Currency Operations](#15-multi-currency-operations)
16. [Website Management (CMS)](#16-website-management-cms)
    - 16.1 [Managing Hotels](#161-managing-hotels)
    - 16.2 [Managing Tours](#162-managing-tours)
    - 16.3 [Managing Car Rentals](#163-managing-car-rentals)
    - 16.4 [Website Content](#164-website-content)
    - 16.5 [Customer Inquiries](#165-customer-inquiries)
17. [Frequently Asked Questions (FAQ)](#17-frequently-asked-questions-faq)
18. [Troubleshooting](#18-troubleshooting)
19. [Glossary](#19-glossary)

---

## 1. Introduction

### What is Sceneside?

Sceneside is an integrated business management system designed for Sceneside L.L.C, a travel and tourism company. The system has two main components:

1. **Public Website** (sceneside.com) - Customer-facing website showcasing hotels, tours, and car rentals
2. **Financial System** (financial.sceneside.com) - Complete accounting and business management platform

### Key Features

- **Double-entry accounting** with automated journal entries
- **Inventory management** with FIFO cost tracking
- **Multi-currency support** (USD, EUR, GBP, UGX)
- **Invoice and bill management** with PDF generation
- **Bank account tracking** and reconciliation
- **Financial reporting** (Balance Sheet, P&L, Trial Balance)
- **Website CMS** for managing public content

---

## 2. Getting Started

### Accessing the System

**Public Website:**
- URL: `https://sceneside.com`
- No login required for visitors

**Financial System:**
- URL: `https://financial.sceneside.com`
- Login required with email and password

### First Login

1. Navigate to `https://financial.sceneside.com`
2. Enter your email address
3. Enter your password
4. Click "Sign In"

### Navigation

The main navigation menu is on the left sidebar:

| Menu Item | Description |
|-----------|-------------|
| Dashboard | Overview of key metrics and recent activity |
| Invoices | Create and manage customer invoices |
| Bills | Track vendor bills and purchases |
| Expenses | Record business expenses |
| Inventory | Manage products and stock levels |
| Customers | Customer database |
| Vendors | Vendor/supplier database |
| Bank | Bank accounts and transactions |
| Journal | Manual journal entries |
| Reports | Financial reports |
| Website | CMS for public website |
| Settings | System configuration |

---

## 3. Dashboard Overview

The dashboard provides a real-time snapshot of your business:

### Key Metrics

| Metric | Description |
|--------|-------------|
| Total Revenue | Sum of all paid invoices (current period) |
| Total Expenses | Sum of all expenses and bills (current period) |
| Net Income | Revenue minus Expenses |
| Cash Balance | Total across all bank accounts |
| Accounts Receivable | Outstanding customer invoices |
| Accounts Payable | Outstanding vendor bills |

### Quick Actions

From the dashboard, you can quickly:
- View overdue invoices
- View overdue bills
- See recent transactions
- Access key reports

---

## 4. Setting Up Your Business

Before processing transactions, set up your business foundation.

### 4.1 Company Settings

**Path:** Settings → Company

Configure your company information:

1. **Company Name:** Sceneside L.L.C
2. **Legal Name:** Full legal business name
3. **EIN:** Tax identification number (99-3334108)
4. **Address:** 121 Bedford Street, Waltham, MA 02453
5. **Phone:** +1 (857) 384-2899
6. **Email:** Contact email address
7. **Base Currency:** USD (default)
8. **Fiscal Year Start:** January (default)
9. **Inventory Method:** FIFO (First In, First Out)
10. **Default Payment Terms:** 30 days

### 4.2 Creating Bank Accounts

**Path:** Bank → Add Account

**Steps:**
1. Click "Add Account" button
2. Enter account details:
   - **Account Name:** e.g., "Bank of America - Checking"
   - **Bank Name:** e.g., "Bank of America"
   - **Account Type:** Checking, Savings, etc.
   - **Currency:** USD, EUR, GBP, or UGX
   - **Opening Balance:** Starting balance
3. Click "Save"

**Important:** Create bank accounts BEFORE recording transactions.

### 4.3 Chart of Accounts

**Path:** Settings → Chart of Accounts (or General Ledger → Accounts)

The system comes with a default chart of accounts. You can add custom accounts:

**Account Types:**
| Type | Code Range | Examples |
|------|------------|----------|
| Assets | 1000-1999 | Cash, Inventory, Equipment |
| Liabilities | 2000-2999 | Accounts Payable, Loans |
| Equity | 3000-3999 | Owner's Capital, Retained Earnings |
| Revenue | 4000-4999 | Sales, Service Income |
| Expenses | 5000-5999 | Cost of Goods, Operating Expenses |

**To Add an Account:**
1. Click "New Account"
2. Enter account code (must be unique)
3. Enter account name
4. Select account type
5. Select subtype (optional)
6. Click "Save"

---

## 5. Managing Customers

**Path:** Customers

Customers are people or businesses you sell to.

### Creating a New Customer

1. Click "New Customer" button
2. Fill in the form:

**Basic Information:**
- **Customer Name** (required): Full name or company name
- **Email (Primary):** Main contact email
- **Email 2-4:** Additional email addresses
- **Phone:** Contact phone number
- **Tax ID:** Customer's tax identification

**Address:**
- Address Line 1
- Address Line 2 (optional)
- City
- State (dropdown)
- Zip Code
- Country

**Payment Settings:**
- **Preferred Currency:** Default currency for invoices
- **Payment Terms:** Due on Receipt, Net 15, Net 30, Net 45, Net 60, Net 90
- **Credit Limit:** Maximum allowed credit

3. Click "Create Customer"

### Editing a Customer

1. Go to Customers
2. Click on customer name or Edit icon
3. Make changes
4. Click "Save Changes"

### Deleting a Customer

1. Go to Customers → Edit Customer
2. Click "Delete Customer" (red button)
3. Confirm deletion

**Note:** Cannot delete customers with existing invoices.

---

## 6. Managing Vendors

**Path:** Vendors

Vendors are suppliers you purchase from.

### Creating a New Vendor

1. Click "New Vendor" button
2. Fill in the form:

**Basic Information:**
- **Vendor Name** (required)
- **Company Name**
- **Email**
- **Phone**
- **Tax ID**
- **1099 Vendor:** Check if vendor receives 1099 forms

**Address:**
- Same fields as customers

**Payment Settings:**
- **Default Currency**
- **Payment Terms**
- **Default Expense Account:** Account to use when creating bills

3. Click "Create Vendor"

---

## 7. Inventory Management

**Path:** Inventory

### 7.1 Adding Products

**To Add a Product:**

1. Click "New Product"
2. Fill in product details:

**Basic Information:**
- **SKU:** Unique product code (e.g., "BOOT-001")
- **Name:** Product name
- **Description:** Detailed description
- **Category:** Product category

**Inventory Type:**
| Type | Description |
|------|-------------|
| Physical Stock | Items you buy and sell (consumables, merchandise) |
| Tour Product | Capacity-based services |
| Equipment | Reusable items |
| Permit/License | Government permits with quotas |

**Pricing:**
- **Unit Price:** Selling price to customers
- **Cost Price:** Purchase cost from vendors
- **Currency:** Product currency

**Inventory Settings:**
- **Track Inventory:** Enable stock tracking
- **Reorder Point:** Quantity to trigger reorder alert
- **Unit of Measure:** Each, Box, Pack, etc.

**Accounting:**
- **Revenue Account:** Where sales are recorded
- **COGS Account:** Cost of Goods Sold account
- **Inventory Account:** Asset account for inventory value

3. Click "Save Product"

### 7.2 Inventory Categories

**Stock Types:**
- **Consumable:** Single-use items (water bottles, snacks)
- **Reusable:** Multi-use items (camping gear)
- **Merchandise:** Items for resale (souvenirs)
- **Spare Part:** Replacement parts

### 7.3 Cost Tracking (FIFO)

The system tracks inventory costs using **FIFO (First In, First Out)**:

**How it works:**
1. Each purchase creates a "cost layer" with quantity and unit cost
2. When you sell items, the oldest cost layers are used first
3. Cost of Goods Sold (COGS) is calculated automatically

**Example:**
- January: Buy 100 units @ $10 each
- March: Buy 50 units @ $12 each
- April: Sell 120 units

**FIFO Calculation:**
- 100 units @ $10 = $1,000 (January layer depleted)
- 20 units @ $12 = $240 (partial March layer)
- **Total COGS = $1,240**

---

## 8. Creating Invoices (Sales)

**Path:** Invoices

Invoices are created when you sell products or services to customers.

### 8.1 Creating a New Invoice

1. Click "New Invoice" button
2. Fill in invoice details:

**Header Information:**
- **Customer:** Select from dropdown (required)
- **Document Type:** Invoice, Quotation, Proforma, or Receipt
  - **Invoice:** Regular sales invoice - **AFFECTS INVENTORY** when sent
  - **Quotation:** Price quote/estimate - informational only, does NOT affect inventory
  - **Proforma Invoice:** Pre-invoice for customs/advance info - does NOT affect inventory
  - **Receipt:** Payment confirmation document
- **Currency:** Auto-selected from customer preference
- **Invoice Date:** Date of invoice
- **Payment Terms:** Select terms (updates due date)
- **Due Date:** Auto-calculated from payment terms
- **PO Number:** Customer's purchase order (optional)

**Line Items:**
For each product/service:
1. Click "Add Line" or use existing line
2. **Product:** Select from dropdown (auto-fills description and price)
3. **Description:** Product/service description
4. **Quantity:** Number of units
5. **Unit Price:** Price per unit
6. **Discount %:** Line discount (optional)
7. **Tax %:** Sales tax rate (enter as percentage)
   - Default: 6.25 (6.25% MA sales tax)
   - Enter as percentage: 6.25 for 6.25%, 10 for 10%, etc.
   - Can be adjusted per line item
   - Set to 0 for tax-exempt items

**Notes:** Add any notes for the customer

3. Click "Save as Draft" or "Create Invoice"

### 8.2 Sending Invoices

After creating an invoice:

1. Review the invoice details
2. Click "Send Invoice" or change status to "Sent"

**What happens when you send:**
- Status changes from "Draft" to "Sent"
- **For Regular Invoices ONLY:**
  - **Inventory is deducted** for physical products
  - **COGS journal entry** is created automatically
- **For Quotations and Proformas:**
  - No inventory changes
  - No accounting entries
  - Remain as informational documents
- Invoice can be emailed to customer (if email configured)

### 8.3 Invoice Statuses

| Status | Description |
|--------|-------------|
| Draft | Invoice created but not finalized |
| Sent | Invoice sent to customer; inventory deducted (regular invoices only) |
| Partial | Partially paid |
| Paid | Fully paid |
| Overdue | Past due date, not fully paid |
| Void | Cancelled/reversed |

### 8.4 Voiding Invoices

To cancel an invoice and restore inventory:

1. Open the invoice
2. Click "Void Invoice"
3. Confirm action

**What happens when voiding:**
- Status changes to "Void"
- **For Regular Invoices:**
  - **Inventory is restored** to original cost layers
  - **Reversal journal entry** is created
  - COGS is reversed
- **For Quotations and Proformas:**
  - No inventory changes needed (none were made)

---

## 9. Creating Bills (Purchases)

**Path:** Bills

Bills are created when you receive invoices from vendors for purchases.

### 9.1 Creating a New Bill

1. Click "New Bill" button
2. Fill in bill details:

**Header Information:**
- **Vendor:** Select from dropdown (required)
- **Bill Number:** Auto-generated or manual entry
- **Bill Date:** Date on vendor's invoice
- **Due Date:** Payment due date
- **Reference:** Vendor's invoice number
- **Currency:** Bill currency

**Line Items:**
For each item:
1. **Product:** Select inventory item (optional)
2. **Description:** What you purchased
3. **Quantity:** Number of units
4. **Unit Price:** Cost per unit (auto-converted if different currency)
5. **Account:** Expense or inventory account

**Notes:** Internal notes

3. Click "Save as Draft"

### 9.2 Approving Bills

Bills with inventory items need approval to update stock:

1. Open the bill
2. Review details
3. Click "Approve Bill"

**What happens when approving:**
- Status changes to "Approved"
- **Inventory is increased** for inventory items
- **Cost layer is created** with purchase cost
- **Journal entry** is created (DR Inventory, CR AP)

### 9.3 Voiding Bills

To cancel a bill and reverse inventory:

1. Open the bill
2. Click "Void Bill"
3. Confirm action

**What happens when voiding:**
- Status changes to "Void"
- **Inventory is reduced** (reverses the addition)
- **Cost layer quantities** are adjusted
- **Reversal journal entry** is created

---

## 10. Recording Expenses

**Path:** Expenses

Expenses are direct costs not tied to vendor bills.

### Creating an Expense

1. Click "New Expense"
2. Fill in details:

**Expense Information:**
- **Date:** Expense date
- **Payee:** Who you paid (or select existing vendor)
- **Amount:** Total expense amount
- **Category:** Expense category
- **Expense Account:** Account to debit
- **Payment Account:** Bank account used for payment
- **Payment Method:** Cash, Check, Card, Transfer

**Additional:**
- **Description:** What the expense was for
- **Receipt:** Upload receipt image
- **Department:** For departmental tracking

3. Click "Save Expense"

**What happens:**
- Journal entry created (DR Expense Account, CR Payment Account)
- Bank balance updated if paid from bank

---

## 11. Creating Receipts

**Path:** Receipts

Receipts are payment confirmations for customers.

### Creating a Receipt

1. Click "New Receipt"
2. Select customer
3. Select payment method
4. Enter amount received
5. Apply to open invoices (optional)
6. Click "Create Receipt"

**The receipt:**
- Generates a PDF receipt
- Can be emailed to customer
- Updates invoice status if applied

---

## 12. Bank Management

**Path:** Bank

### 12.1 Recording Transactions

**To Record a Bank Transaction:**

1. Go to Bank → Transactions
2. Click "Add Transaction"
3. Select transaction type:
   - **Deposit:** Money coming in
   - **Withdrawal:** Money going out
   - **Transfer:** Between accounts

4. Fill in details:
   - **Date**
   - **Bank Account**
   - **Amount**
   - **Payee/Description**
   - **Category/Account**

5. Click "Save"

### 12.2 Bank Transfers

**To Transfer Between Accounts:**

1. Go to Bank → Transfers
2. Click "New Transfer"
3. Select:
   - **From Account**
   - **To Account**
   - **Amount**
   - **Date**
4. Click "Create Transfer"

**Note:** If accounts have different currencies, exchange rate is applied automatically.

### 12.3 Reconciliation

Monthly bank reconciliation ensures your records match bank statements:

1. Go to Bank → Select Account → Reconcile
2. Enter statement date and ending balance
3. Check off transactions that appear on statement
4. Review difference (should be $0.00)
5. Click "Finish Reconciliation"

---

## 13. Journal Entries

**Path:** Journal Entries

For manual accounting adjustments.

### Creating a Journal Entry

1. Click "New Entry"
2. Enter:
   - **Date**
   - **Description/Memo**
   - **Line Items:** Each with Account, Debit, and Credit amounts

**Important Rules:**
- Total Debits MUST equal Total Credits
- Each entry must have at least 2 lines

3. Click "Save as Draft" or "Post Entry"

**Entry Statuses:**
| Status | Description |
|--------|-------------|
| Draft | Can be edited |
| Posted | Finalized, affects account balances |
| Void | Cancelled |

---

## 14. Financial Reports

**Path:** Reports

### Available Reports

| Report | Description |
|--------|-------------|
| **Balance Sheet** | Assets, Liabilities, and Equity at a point in time |
| **Profit & Loss** | Revenue and Expenses for a period |
| **Trial Balance** | All account balances |
| **General Ledger** | Detailed transaction history by account |
| **Cash Flow** | Cash movement analysis |
| **AR Aging** | Outstanding customer invoices by age |
| **AP Aging** | Outstanding vendor bills by age |
| **Sales by Customer** | Revenue breakdown by customer |
| **Sales by Product** | Revenue breakdown by product |
| **Purchases by Vendor** | Spending breakdown by vendor |
| **Inventory Valuation** | Current inventory value |
| **Tax Summary** | Tax collected and owed |

### Running a Report

1. Select report from Reports menu
2. Choose date range or "As of" date
3. Select any filters (customer, vendor, account)
4. Click "Generate Report"
5. Export to PDF or Excel if needed

---

## 15. Multi-Currency Operations

The system supports multiple currencies:
- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **UGX** - Ugandan Shilling (USh)

### How It Works

1. **Base Currency:** USD is the base currency
2. **Customer Currency:** Each customer has a preferred currency
3. **Automatic Conversion:** Invoices and bills convert to base currency for reporting

### Exchange Rates

- Rates are updated automatically
- Historical rates are stored for accurate reporting
- You can manually update rates if needed

### Creating Foreign Currency Transactions

1. Select the appropriate currency when creating invoice/bill
2. System applies current exchange rate
3. Amounts are converted to USD for accounting

---

## 16. Website Management (CMS)

**Path:** Website

### 16.1 Managing Hotels

**Path:** Website → Hotels

**To Add a Hotel:**
1. Click "Add Hotel"
2. Fill in details:
   - Name, Location, Description
   - Star Rating (1-5)
   - Price Range
   - Amenities (select from list)
   - Upload images
   - Featured toggle
3. Click "Save"

### 16.2 Managing Tours

**Path:** Website → Tours

**To Add a Tour:**
1. Click "Add Tour"
2. Fill in details:
   - Name, Location, Description
   - Duration (days)
   - Price per person
   - Max group size
   - Difficulty level
   - Itinerary (day by day)
   - What's included/excluded
   - Upload images
3. Click "Save"

### 16.3 Managing Car Rentals

**Path:** Website → Cars

**To Add a Vehicle:**
1. Click "Add Vehicle"
2. Fill in details:
   - Brand, Model, Year
   - Category (Economy, SUV, Luxury, etc.)
   - Pricing (daily, weekly, monthly rates)
   - Features (GPS, Bluetooth, etc.)
   - Upload images
3. Click "Save"

### 16.4 Website Content

**Path:** Website → Content

Edit text content displayed on the public website:
- Hero section titles
- About section
- Contact information
- Footer text

### 16.5 Customer Inquiries

**Path:** Website → Inquiries

View and manage inquiries from website visitors:

1. View all inquiries with status
2. Filter by: New, Contacted, Closed
3. Click inquiry to view details
4. Update status as you follow up
5. Add notes for internal tracking

---

## 17. Frequently Asked Questions (FAQ)

### General Questions

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page and enter your email. You'll receive a password reset link.

**Q: Can multiple people use the system?**
A: Yes, you can create multiple user accounts with different roles (Admin, Manager, Accountant, etc.).

**Q: How is data backed up?**
A: Data is stored in Supabase cloud database with automatic backups.

### Invoicing Questions

**Q: Why can't I edit a sent invoice?**
A: Once sent, invoices affect inventory and accounting records. To make changes, void the invoice and create a new one.

**Q: How do I apply a payment to an invoice?**
A: Go to Invoices → Select Invoice → Record Payment. Enter the amount and payment details.

**Q: Can I send invoices by email?**
A: Yes, the system generates PDF invoices that can be emailed directly to customers.

**Q: What's the difference between Invoice and Receipt?**
A: An Invoice is a request for payment (customer owes you money). A Receipt confirms payment has been received.

**Q: How do I change the tax rate on an invoice?**
A: Each line item has a Tax % field. Enter the tax rate as a percentage (e.g., 6.25 for 6.25%, 10 for 10%). You can set different tax rates per line item, or 0 for tax-exempt items.

**Q: Why do some items have different tax rates?**
A: Some products may be tax-exempt or have different tax rates. You can edit the Tax % field for each line item individually.

**Q: What's the difference between Invoice, Quotation, and Proforma?**
A: **Invoice** = Actual sale that affects inventory and accounting. **Quotation** = Price estimate only, no inventory impact. **Proforma** = Pre-invoice for customs/information, no inventory impact.

**Q: Do quotations affect my inventory?**
A: No. Only regular invoices (document_type = "invoice") affect inventory when sent. Quotations and proforma invoices are informational documents only.

**Q: How do I convert a quotation to a real invoice?**
A: Create a new invoice using the same line items from the quotation. Only the new invoice will affect inventory.

### Inventory Questions

**Q: Why is my inventory not updating?**
A: Inventory only updates when **regular invoices** (not quotations/proformas) are "Sent" (not Draft) and bills are "Approved" (not Draft). Quotations and proforma invoices do not affect inventory.

**Q: What is FIFO?**
A: FIFO (First In, First Out) means oldest inventory is sold first. This affects how Cost of Goods Sold is calculated.

**Q: How do I adjust inventory quantities?**
A: Use Inventory Adjustments to manually increase or decrease stock levels.

**Q: What does "Zero Cost Warning" mean?**
A: This warning appears when you try to sell a product that has no cost layers (no purchase history). The system won't be able to calculate COGS.

### Billing Questions

**Q: What's the difference between a Bill and an Expense?**
A: Bills are for vendor invoices (may include inventory). Expenses are direct costs without a vendor invoice.

**Q: Why do I need to approve bills?**
A: Approval confirms the purchase and updates inventory. Draft bills don't affect inventory or accounting.

### Bank Questions

**Q: Why doesn't my bank balance match?**
A: Run bank reconciliation to match transactions with your bank statement. Differences may be due to unrecorded transactions.

**Q: How do I handle foreign currency in bank accounts?**
A: Create separate bank accounts for each currency. Transfers between currencies use exchange rates.

### Reporting Questions

**Q: Why are my reports showing $0?**
A: Ensure journal entries are "Posted" not "Draft". Draft entries don't affect account balances.

**Q: How do I see profit for a specific period?**
A: Run Profit & Loss report with your desired date range.

---

## 18. Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Can't login | Wrong password | Use "Forgot Password" to reset |
| Invoice won't send | Missing customer email | Add email to customer record |
| Inventory not deducting | Invoice in draft | Change status to "Sent" |
| Bill not updating inventory | Bill not approved | Approve the bill |
| Journal entry won't save | Debits ≠ Credits | Ensure total debits equal total credits |
| Report shows wrong amounts | Draft entries | Post all relevant journal entries |
| Currency conversion wrong | Outdated exchange rate | Update exchange rates |
| PDF won't generate | Browser blocking | Allow popups from the site |

### Error Messages

| Error | Meaning | Action |
|-------|---------|--------|
| "Insufficient inventory" | Not enough stock to fulfill order | Add inventory via bills or adjustments |
| "Journal entry does not balance" | Debits ≠ Credits | Review and fix line items |
| "Customer not found" | Invalid customer reference | Select valid customer |
| "Duplicate entry number" | Number already exists | System will auto-generate unique number |

### Getting Help

If you encounter issues not covered here:
1. Check this manual's relevant section
2. Review the FAQ above
3. Contact system administrator
4. Email support at info@sceneside.com

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **Accounts Payable (AP)** | Money you owe to vendors |
| **Accounts Receivable (AR)** | Money customers owe you |
| **Balance Sheet** | Financial statement showing assets, liabilities, equity |
| **Bill** | Invoice received from a vendor for purchases |
| **COGS** | Cost of Goods Sold - cost of inventory items sold |
| **Credit** | Right side of journal entry; increases liabilities/equity/revenue |
| **Debit** | Left side of journal entry; increases assets/expenses |
| **FIFO** | First In, First Out inventory costing method |
| **General Ledger** | Main accounting record of all transactions |
| **Invoice** | Document requesting payment from a customer |
| **Journal Entry** | Record of a financial transaction |
| **P&L** | Profit and Loss statement (Income Statement) |
| **Payment Terms** | Number of days until payment is due |
| **Receipt** | Confirmation of payment received |
| **Reconciliation** | Matching your records with bank statements |
| **SKU** | Stock Keeping Unit - unique product identifier |
| **Trial Balance** | List of all account balances |
| **Vendor** | Supplier you purchase from |
| **Void** | Cancel a transaction and reverse its effects |

---

## Quick Reference Card

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New (in most sections) |
| `Ctrl + S` | Save |
| `Ctrl + P` | Print |
| `Esc` | Cancel / Close dialog |

### Common Workflows

**Daily Tasks:**
1. Check dashboard for overdue items
2. Send pending invoices
3. Record received payments
4. Review new inquiries

**Weekly Tasks:**
1. Review AR aging report
2. Pay vendor bills
3. Reconcile bank accounts
4. Update inventory if needed

**Monthly Tasks:**
1. Generate P&L report
2. Generate Balance Sheet
3. Complete bank reconciliation
4. Review AR/AP aging
5. Update exchange rates if needed

---

## Contact Information

**Sceneside L.L.C**  
121 Bedford Street  
Waltham, MA 02453  
Phone: +1 (857) 384-2899  
Email: info@sceneside.com  
Website: www.sceneside.com

---

*This manual is for Sceneside L.L.C internal use. For the latest updates, refer to the system documentation.*

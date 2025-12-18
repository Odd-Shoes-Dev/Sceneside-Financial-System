# Inventory System Redesign - Sceneside L.L.C Tourism Business
## Implementation Plan

---

## Executive Summary

Redesigning the inventory system to properly follow accounting principles where **all stock is inventory, but not all inventory is stock**. The system will now support four distinct inventory categories specific to tourism operations:

1. **Physical Stock** (Tangible items you can touch)
2. **Fixed Assets** (Long-term physical assets - already exists)
3. **Tour Products** (Services and capacity-based offerings)
4. **Permits & Intangible Inventory** (Licenses, contracts, rights)

---

## 1. PHYSICAL STOCK MANAGEMENT

### Categories & Solutions:

#### A. **Consumables** (Used up during operations)
**Items:** Fuel, food, water, toiletries, first aid supplies, stationery
**Tracking Method:** Unit-based with batch tracking
**Solution:**
- Track by **unit of measure** (gallons, liters, bottles, boxes)
- **Batch/Lot tracking** for items with expiry dates (food, medical supplies)
- **Reorder points** for automatic restocking alerts
- **FIFO costing** for accurate valuation

**Fields Required:**
```
- SKU
- Item Name
- Category: Consumables
- Sub-category: (Fuel, Food, Water, Supplies, etc.)
- Unit of Measure
- Quantity on Hand
- Reorder Point
- Reorder Quantity
- Unit Cost
- Batch/Lot Number (optional)
- Expiry Date (optional)
- Storage Location
- Supplier
```

---

#### B. **Reusable Items** (Long-term use with maintenance)
**Items:** Tents, sleeping bags, cooking gear, hiking equipment, gorilla tracking gear
**Tracking Method:** Individual item or batch with condition tracking
**Solution:**
- Track **condition status** (New, Good, Fair, Needs Repair, Out of Service)
- **Maintenance schedule** and history
- **Checkout/Check-in** system for tour assignments
- **Depreciation** for accounting (not as fast as fixed assets)

**Fields Required:**
```
- Item ID/Serial Number
- Item Name
- Category: Reusable Equipment
- Sub-category: (Camping, Tracking, Cooking, etc.)
- Quantity on Hand
- Condition Status
- Last Maintenance Date
- Next Maintenance Due
- Currently Assigned To (Tour/Guide)
- Purchase Date
- Purchase Cost
- Current Value (depreciated)
- Notes
```

---

#### C. **Merchandise** (Resale items)
**Items:** Branded T-shirts, caps, souvenirs
**Tracking Method:** Variants (size, color) with stock levels
**Solution:**
- **Variant tracking** (e.g., T-shirt → Small/Red, Medium/Blue, etc.)
- Standard inventory management with reorder points
- **Cost tracking** for COGS
- **Sales pricing** per variant

**Fields Required:**
```
- SKU
- Product Name
- Category: Merchandise
- Variants: Size, Color, Style
- Quantity per Variant
- Reorder Point
- Unit Cost
- Selling Price
- Supplier
- Storage Location
```

---

#### D. **Spare Parts** (Maintenance inventory)
**Items:** Vehicle parts, equipment components
**Tracking Method:** Linked to specific assets
**Solution:**
- **Link to asset** (which vehicle/equipment it belongs to)
- Track **compatibility** (fits multiple assets)
- **Critical vs non-critical** classification
- Reorder alerts based on asset maintenance schedules

**Fields Required:**
```
- Part Number
- Part Name
- Category: Spare Parts
- Compatible Assets (linked to asset register)
- Quantity on Hand
- Reorder Point
- Unit Cost
- Supplier
- Critical Part (Yes/No)
- Storage Location
```

---

## 2. FIXED ASSETS REGISTER

**Status:** ✅ Already implemented in `assets` table
**Items:** Tour vehicles, boats, office equipment, computers

**Enhancements Needed:**
- Link spare parts to specific assets
- Track **asset utilization** (how often used on tours)
- **Maintenance reminders** integration with spare parts

---

## 3. TOUR PRODUCTS (SERVICE INVENTORY)

### Capacity-Based Offerings

**Types:**
- Tour packages (safaris, cultural tours, day trips)
- Hotel room allocations (partner agreements)
- Transport seats (bus, van, boat)
- Activity slots (gorilla permits, park entries, guides)

**Tracking Model:** Hybrid (Fixed dates + Ongoing availability)

**Solution:**
- **Base product** defines the tour/service
- **Date-based capacity** for scheduled departures
- **Ongoing availability** for flexible/daily offerings
- **Real-time booking** vs **available capacity**

**Fields Required:**
```
Base Product:
- Product ID
- Tour/Service Name
- Category: Tour Product
- Type: (Package, Transport, Activity, Accommodation)
- Base Price
- Duration
- Description
- Inclusions/Exclusions
- Max Capacity (if fixed)

Capacity Tracking:
- Date Range (for scheduled tours)
- Total Capacity (seats/slots)
- Booked Capacity
- Available Capacity (calculated)
- Booking Status (Open, Nearly Full, Sold Out, Completed)
- Guide Assigned
- Vehicle Assigned
- Linked Permits Required
```

**Example:**
```
Tour: "3-Day Bwindi Gorilla Safari"
Total Capacity: 20 seats
Dates: Jan 15-17, 2025
Booked: 18 seats
Available: 2 seats
Status: Nearly Full
Required Permits: 20x Gorilla Trekking Permits
Assigned Vehicle: Van-001
Assigned Guide: Guide-John
```

---

## 4. PERMITS & INTANGIBLE INVENTORY

### License & Rights Management

**Items:**
- National park permits
- Gorilla trekking permits
- Tour operator licenses
- Hotel/lodge contracts
- Insurance policies
- Trained staff certifications

**Tracking Model:** Renewable with expiry tracking

**Solution:**
- Track as **limited quantity items** (permits have quotas)
- **Expiry dates** with automatic renewal reminders
- **Link to tours** that require them
- **Cost per permit** for tour costing
- **Status tracking** (Active, Expiring Soon, Expired, Pending Renewal)

**Fields Required:**
```
- Permit/License ID
- Name/Type
- Category: Permits & Licenses
- Issuing Authority
- Issue Date
- Expiry Date
- Renewal Frequency (Annual, Quarterly, etc.)
- Days Until Expiry (calculated)
- Status (Active, Expiring Soon, Expired)
- Quantity Available (for quota-based permits)
- Cost per Unit
- Linked Tours (which tours need this)
- Notes
- Renewal Reminder (30/60/90 days before expiry)
```

**Example:**
```
Permit: "Gorilla Trekking Permit - Bwindi"
Quantity Allocated: 100 permits/month
Used This Month: 45
Available: 55
Cost per Permit: $700
Valid Through: Dec 31, 2025
Renewal Status: Active
Days Until Expiry: 13 days
Linked Tours: Gorilla Safari packages
Alert: Renewal due in 13 days
```

---

## 5. INVENTORY SUMMARY DASHBOARD

### Comprehensive Overview

**Four Section Layout:**

### A. Physical Stock Summary
```
Total Stock Value: $25,450.00
Total Items: 234
Low Stock Items: 12
Expiring Soon: 5

Breakdown by Category:
- Consumables: $8,200 (125 items)
- Reusable Equipment: $12,500 (45 items)
- Merchandise: $3,500 (58 items)
- Spare Parts: $1,250 (6 items)
```

### B. Fixed Assets Summary
```
Total Asset Value (Book): $185,000.00
Total Assets: 12
Depreciation (YTD): $15,200.00
Maintenance Due: 3 assets

Categories:
- Vehicles: $150,000 (8 vehicles)
- Office Equipment: $25,000
- Tour Equipment: $10,000
```

### C. Tour Products Capacity
```
Active Tours: 25
Total Capacity This Month: 500 seats
Booked: 320 seats (64% occupancy)
Available: 180 seats

Status:
- Sold Out Tours: 8
- Nearly Full (>80%): 5
- Available: 12
```

### D. Permits & Licenses Status
```
Active Permits: 15
Expiring Within 30 Days: 3
Available Capacity: 245 permits
Used This Month: 78 permits

Action Required:
⚠️ Gorilla Permits - Renew in 13 days
⚠️ Tour Operator License - Renew in 25 days
✅ Park Entry Permits - Valid for 11 months
```

### E. Combined Inventory Value
```
Total Inventory Value: $210,450.00

Components:
- Physical Stock: $25,450 (12%)
- Fixed Assets: $185,000 (88%)
- Tour Products: N/A (service-based)
- Permits: Tracked separately (not valued in inventory)
```

---

## 6. LOCATION/WAREHOUSE MANAGEMENT SYSTEM

### Current Problem
❌ No location tracking exists in products table  
❌ Location hardcoded to "Main Warehouse" in inventory valuation API  
❌ Cannot track which items are stored where  
❌ Cannot support multiple warehouses/storage locations  

### Solution Overview
Create a comprehensive location management system to track:
- Multiple storage locations (warehouses, offices, vehicles, branches)
- Stock quantity per location
- Inter-location transfers
- Location-specific inventory reports

---

### A. Database Schema

#### Locations Table (New)
```sql
CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  
  -- Basic Information
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "WH-001", "OFFICE-MAIN", "VAN-001"
  name VARCHAR(255) NOT NULL, -- e.g., "Main Warehouse", "Downtown Office"
  location_type VARCHAR(50) NOT NULL, -- 'warehouse', 'office', 'vehicle', 'retail', 'storage'
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Uganda',
  
  -- Contact
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Settings
  is_default BOOLEAN DEFAULT false, -- Default location for new items
  is_active BOOLEAN DEFAULT true,
  is_mobile BOOLEAN DEFAULT false, -- For vehicles/portable storage
  
  -- Capacity (optional)
  total_capacity DECIMAL(15,2), -- Square meters or cubic meters
  current_utilization DECIMAL(5,2), -- Percentage
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX idx_inventory_locations_company ON inventory_locations(company_id);
CREATE INDEX idx_inventory_locations_type ON inventory_locations(location_type);
CREATE INDEX idx_inventory_locations_active ON inventory_locations(is_active);
CREATE UNIQUE INDEX idx_inventory_locations_code ON inventory_locations(company_id, code);

COMMENT ON TABLE inventory_locations IS 'Physical locations where inventory is stored';
```

#### Product Stock Locations Table (New - Multi-location support)
```sql
CREATE TABLE product_stock_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
  
  -- Stock Quantities
  quantity_on_hand DECIMAL(15,4) DEFAULT 0,
  quantity_reserved DECIMAL(15,4) DEFAULT 0,
  quantity_available DECIMAL(15,4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  
  -- Reorder Settings (location-specific)
  reorder_point DECIMAL(15,4),
  reorder_quantity DECIMAL(15,4),
  
  -- Bin/Shelf Location (within the location)
  bin_location VARCHAR(100), -- e.g., "Aisle 3, Shelf B, Bin 12"
  
  -- Timestamps
  last_counted_at TIMESTAMPTZ, -- Last physical count
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_product_location UNIQUE(product_id, location_id)
);

-- Indexes
CREATE INDEX idx_product_stock_locations_product ON product_stock_locations(product_id);
CREATE INDEX idx_product_stock_locations_location ON product_stock_locations(location_id);
CREATE INDEX idx_product_stock_locations_low_stock ON product_stock_locations(product_id, location_id) 
  WHERE quantity_on_hand <= reorder_point;

COMMENT ON TABLE product_stock_locations IS 'Track inventory quantities at each location';
```

#### Stock Transfers Table (New - Track inter-location movements)
```sql
CREATE TABLE stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  
  -- Transfer Details
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'in_transit', 'completed', 'cancelled'
  
  -- Locations
  from_location_id UUID NOT NULL REFERENCES inventory_locations(id),
  to_location_id UUID NOT NULL REFERENCES inventory_locations(id),
  
  -- Logistics
  shipped_date DATE,
  expected_delivery_date DATE,
  received_date DATE,
  
  shipping_method VARCHAR(100), -- 'internal_transfer', 'courier', 'truck', etc.
  tracking_number VARCHAR(255),
  
  -- Responsibility
  transferred_by UUID REFERENCES user_profiles(id), -- Who initiated
  shipped_by UUID REFERENCES user_profiles(id), -- Who sent it
  received_by UUID REFERENCES user_profiles(id), -- Who received it
  
  -- Notes
  reason TEXT, -- Why transfer is happening
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  
  CONSTRAINT check_different_locations CHECK (from_location_id != to_location_id)
);

-- Indexes
CREATE INDEX idx_stock_transfers_company ON stock_transfers(company_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_from_location ON stock_transfers(from_location_id);
CREATE INDEX idx_stock_transfers_to_location ON stock_transfers(to_location_id);
CREATE INDEX idx_stock_transfers_date ON stock_transfers(transfer_date);

COMMENT ON TABLE stock_transfers IS 'Track stock movements between locations';
```

#### Stock Transfer Items Table (New)
```sql
CREATE TABLE stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Quantities
  quantity_requested DECIMAL(15,4) NOT NULL,
  quantity_shipped DECIMAL(15,4) DEFAULT 0,
  quantity_received DECIMAL(15,4) DEFAULT 0,
  
  -- Tracking
  unit_of_measure VARCHAR(50),
  batch_number VARCHAR(100), -- If batch tracking is enabled
  serial_numbers TEXT[], -- If serial tracking is enabled
  
  -- Condition (for reusable items)
  condition_on_send VARCHAR(50), -- 'new', 'good', 'fair', etc.
  condition_on_receive VARCHAR(50),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_product ON stock_transfer_items(product_id);

COMMENT ON TABLE stock_transfer_items IS 'Line items for each stock transfer';
```

#### Update Products Table
```sql
-- Add default_location_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_location_id UUID REFERENCES inventory_locations(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_by_location BOOLEAN DEFAULT true;

COMMENT ON COLUMN products.default_location_id IS 'Primary/default storage location for this product';
COMMENT ON COLUMN products.track_by_location IS 'Whether to track quantities by location';

-- Create index
CREATE INDEX idx_products_default_location ON products(default_location_id);
```

---

### B. API Endpoints Required

#### 1. Locations API (`/api/inventory/locations`)

**GET /api/inventory/locations**
```typescript
// List all locations
Query params: ?type=warehouse&active=true
Response: {
  data: [
    {
      id: "uuid",
      code: "WH-001",
      name: "Main Warehouse",
      location_type: "warehouse",
      address: {...},
      is_active: true,
      is_default: true,
      created_at: "2024-01-01"
    }
  ]
}
```

**POST /api/inventory/locations**
```typescript
// Create new location
Body: {
  code: "WH-002",
  name: "Secondary Warehouse",
  location_type: "warehouse",
  address_line1: "Plot 45, Industrial Area",
  city: "Kampala",
  is_active: true
}
```

**PUT /api/inventory/locations/:id**
```typescript
// Update location
```

**DELETE /api/inventory/locations/:id**
```typescript
// Soft delete location (only if no stock present)
```

**GET /api/inventory/locations/:id/stock**
```typescript
// Get all stock at this location
Response: {
  location: {...},
  stock_items: [
    {
      product_id: "uuid",
      product_name: "Tent",
      sku: "TENT-001",
      quantity_on_hand: 25,
      quantity_available: 20,
      quantity_reserved: 5,
      bin_location: "Aisle 3-B-12"
    }
  ],
  total_value: 45000.00
}
```

#### 2. Product Stock Locations API

**GET /api/inventory/products/:productId/locations**
```typescript
// Get stock levels across all locations for a product
Response: {
  product: {...},
  locations: [
    {
      location_id: "uuid",
      location_name: "Main Warehouse",
      quantity_on_hand: 50,
      quantity_available: 45,
      reorder_point: 10
    },
    {
      location_id: "uuid",
      location_name: "Downtown Office",
      quantity_on_hand: 5,
      quantity_available: 5,
      reorder_point: 2
    }
  ],
  total_quantity: 55
}
```

**POST /api/inventory/products/:productId/locations**
```typescript
// Add stock at a new location
Body: {
  location_id: "uuid",
  quantity_on_hand: 100,
  reorder_point: 20,
  bin_location: "Shelf A-1"
}
```

**PUT /api/inventory/products/:productId/locations/:locationId**
```typescript
// Update stock levels or settings at a location
```

#### 3. Stock Transfers API

**GET /api/inventory/transfers**
```typescript
// List all transfers
Query params: ?status=pending&from_location=uuid&to_location=uuid
```

**POST /api/inventory/transfers**
```typescript
// Create new transfer request
Body: {
  from_location_id: "uuid",
  to_location_id: "uuid",
  transfer_date: "2024-12-18",
  items: [
    {
      product_id: "uuid",
      quantity_requested: 10,
      notes: "Needed for upcoming tour"
    }
  ],
  reason: "Stock rebalancing"
}
```

**PUT /api/inventory/transfers/:id/ship**
```typescript
// Mark transfer as shipped
Body: {
  shipped_date: "2024-12-18",
  tracking_number: "TRK-123456",
  items: [
    {
      item_id: "uuid",
      quantity_shipped: 10
    }
  ]
}
// Deducts from source location
```

**PUT /api/inventory/transfers/:id/receive**
```typescript
// Mark transfer as received
Body: {
  received_date: "2024-12-19",
  items: [
    {
      item_id: "uuid",
      quantity_received: 10,
      condition_on_receive: "good"
    }
  ]
}
// Adds to destination location
```

**PUT /api/inventory/transfers/:id/cancel**
```typescript
// Cancel transfer (only if not shipped)
```

---

### C. User Interface Components

#### 1. Location Management Page (`/dashboard/inventory/locations`)

**Features:**
- List all locations with filters (type, active/inactive)
- Add new location button
- Edit/delete locations
- View stock summary per location
- Set default location

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Locations & Warehouses              [+ Add] │
├─────────────────────────────────────────────┤
│ Filters: [All Types ▼] [Active ▼]          │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 📦 Main Warehouse (WH-001)       [Edit]│ │
│ │    Warehouse • Kampala                  │ │
│ │    Stock Items: 234 • Value: $45,000   │ │
│ │    [View Stock] [Transfer]              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏢 Downtown Office (OFF-001)     [Edit]│ │
│ │    Office • Kampala                     │ │
│ │    Stock Items: 45 • Value: $8,500     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### 2. Add/Edit Location Form

**Fields:**
- Location Code* (auto-generated or manual)
- Location Name*
- Location Type* (dropdown: Warehouse, Office, Vehicle, Storage, Retail)
- Address (full address form)
- Contact Person
- Phone
- Email
- Is Default Location (checkbox)
- Is Active (checkbox)
- Is Mobile (checkbox) - for vehicles
- Total Capacity (optional, with unit)
- Notes

#### 3. Product Form Updates (New/Edit Inventory Item)

**Add Location Section:**
```
┌─────────────────────────────────────────────┐
│ Storage Location                            │
├─────────────────────────────────────────────┤
│ Default Location: [Main Warehouse    ▼]    │
│                   [+ Add New Location]      │
│                                             │
│ □ Track stock by location                  │
│                                             │
│ Initial Stock Quantities:                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Location          Quantity    Bin/Shelf │ │
│ ├─────────────────────────────────────────┤ │
│ │ Main Warehouse    100         A-3-12    │ │
│ │ [+ Add Another Location]                │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### 4. Stock Transfer Page (`/dashboard/inventory/transfers`)

**Transfer Request Form:**
```
┌─────────────────────────────────────────────┐
│ Create Stock Transfer                       │
├─────────────────────────────────────────────┤
│ Transfer From: [Main Warehouse      ▼]     │
│ Transfer To:   [Downtown Office     ▼]     │
│ Transfer Date: [2024-12-18]                │
│ Expected Delivery: [2024-12-19]            │
│                                             │
│ Items to Transfer:                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Product         Available   Transfer Qty│ │
│ ├─────────────────────────────────────────┤ │
│ │ Tent           50          [10]     [X] │ │
│ │ Sleeping Bag   30          [5]      [X] │ │
│ │ [+ Add Item]                            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Reason: [Stock rebalancing for tour]       │
│ Notes:  [                              ]   │
│                                             │
│ [Cancel]            [Create Transfer]       │
└─────────────────────────────────────────────┘
```

**Transfer List View:**
```
┌─────────────────────────────────────────────┐
│ Stock Transfers                             │
├─────────────────────────────────────────────┤
│ Status: [All ▼] Date: [Last 30 Days ▼]    │
├─────────────────────────────────────────────┤
│ TRF-001 • Pending                           │
│ Main Warehouse → Downtown Office            │
│ 3 items • Created: Dec 18, 2024           │
│ [View] [Ship] [Cancel]                     │
├─────────────────────────────────────────────┤
│ TRF-002 • In Transit                        │
│ Downtown Office → Tour Vehicle Van-001      │
│ 5 items • Shipped: Dec 17, 2024           │
│ [View] [Mark Received]                     │
└─────────────────────────────────────────────┘
```

#### 5. Product Detail Page Updates

**Add Location Stock Section:**
```
┌─────────────────────────────────────────────┐
│ Stock by Location                           │
├─────────────────────────────────────────────┤
│ Total Stock: 155 units                      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📦 Main Warehouse                       │ │
│ │    On Hand: 100 • Available: 95        │ │
│ │    Reserved: 5 • Bin: A-3-12           │ │
│ │    [Transfer Stock] [Adjust]           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏢 Downtown Office                      │ │
│ │    On Hand: 50 • Available: 50         │ │
│ │    Bin: Storage Room 2                 │ │
│ │    [Transfer Stock] [Adjust]           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🚐 Van-001 (Mobile)                     │ │
│ │    On Hand: 5 • Available: 5           │ │
│ │    [Transfer Stock] [Adjust]           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Add to New Location]                     │
└─────────────────────────────────────────────┘
```

#### 6. Inventory Reports Updates

**Inventory Valuation Report:**
- Add location filter dropdown (dynamic from locations table)
- Show location column with actual location names
- Add "Stock by Location" breakdown section

**New Report: Stock Transfer History**
- Filter by date range, locations, status
- Show all transfer movements
- Export to PDF/Excel

**New Report: Location Stock Summary**
- Compare stock levels across locations
- Show which locations are overstocked/understocked
- Suggest rebalancing transfers

---

### D. Implementation Steps

#### Phase 1: Database Setup (Week 1)
1. Create migration `023_add_location_management.sql`
2. Create all 4 new tables:
   - `inventory_locations`
   - `product_stock_locations`
   - `stock_transfers`
   - `stock_transfer_items`
3. Add location columns to `products` table
4. Create indexes for performance
5. **Seed default location:**
```sql
INSERT INTO inventory_locations (company_id, code, name, location_type, is_default, is_active)
SELECT 
  id as company_id,
  'WH-001' as code,
  'Main Warehouse' as name,
  'warehouse' as location_type,
  true as is_default,
  true as is_active
FROM companies;
```
6. **Migrate existing products to default location:**
```sql
INSERT INTO product_stock_locations (product_id, location_id, quantity_on_hand, quantity_reserved)
SELECT 
  p.id as product_id,
  il.id as location_id,
  p.quantity_on_hand,
  p.quantity_reserved
FROM products p
CROSS JOIN inventory_locations il
WHERE il.is_default = true
  AND p.track_inventory = true;
```

#### Phase 2: API Development (Week 2)
1. Create `/api/inventory/locations` endpoints (CRUD)
2. Create `/api/inventory/products/:id/locations` endpoints
3. Create `/api/inventory/transfers` endpoints
4. Update existing inventory API to support location filtering
5. Update inventory valuation API to use actual locations:
```typescript
// Replace hardcoded location
location: item.product_stock_locations?.[0]?.inventory_locations?.name || 'Unassigned',
```

#### Phase 3: UI Components (Week 3-4)
1. Build Location Management page
2. Build Add/Edit Location forms
3. Update Product forms to include location selection
4. Build Stock Transfer interface
5. Update Product Detail page with location stock
6. Add location filters to existing inventory pages

#### Phase 4: Reports Integration (Week 5)
1. Update Inventory Valuation report with location filtering
2. Create Stock Transfer History report
3. Create Location Stock Summary report
4. Add location breakdown to Inventory Summary dashboard

#### Phase 5: Testing & Migration (Week 6)
1. Test location CRUD operations
2. Test multi-location stock tracking
3. Test stock transfer workflow
4. Migrate existing data
5. User acceptance testing
6. Deploy to production

---

### E. Business Rules & Validation

1. **Cannot delete location if:**
   - Stock exists at that location (quantity > 0)
   - Pending transfers involve that location
   - It's the only active location

2. **Stock transfers:**
   - Cannot transfer more than available quantity
   - Source location must have sufficient stock
   - Cannot transfer between same location
   - Must mark as shipped before receiving
   - Shipped quantity cannot exceed requested

3. **Default location:**
   - Only one location can be default per company
   - New products auto-assigned to default location
   - Setting new default removes old default flag

4. **Permissions:**
   - Admin: Full access to locations and transfers
   - Manager: Can create transfers, view all locations
   - Viewer: Read-only access

---

### F. Migration Strategy for Existing Data

```sql
-- Step 1: Create default location for each company
INSERT INTO inventory_locations (company_id, code, name, location_type, is_default, is_active, city, country)
SELECT 
  id,
  'WH-001',
  'Main Warehouse',
  'warehouse',
  true,
  true,
  'Kampala',
  'Uganda'
FROM companies;

-- Step 2: Set default location for all existing products
UPDATE products p
SET default_location_id = (
  SELECT id FROM inventory_locations 
  WHERE company_id = p.company_id 
  AND is_default = true 
  LIMIT 1
);

-- Step 3: Migrate existing stock quantities to location tracking
INSERT INTO product_stock_locations (
  product_id, 
  location_id, 
  quantity_on_hand, 
  quantity_reserved,
  reorder_point,
  reorder_quantity
)
SELECT 
  p.id,
  p.default_location_id,
  p.quantity_on_hand,
  p.quantity_reserved,
  p.reorder_point,
  p.reorder_quantity
FROM products p
WHERE p.track_inventory = true
  AND p.default_location_id IS NOT NULL;

-- Step 4: Verify migration
SELECT 
  p.name,
  p.quantity_on_hand as old_qty,
  psl.quantity_on_hand as new_qty,
  il.name as location
FROM products p
LEFT JOIN product_stock_locations psl ON p.id = psl.product_id
LEFT JOIN inventory_locations il ON psl.location_id = il.id
WHERE p.track_inventory = true;
```

---

### G. Future Enhancements

1. **Barcode/QR Code Support**
   - Generate location QR codes
   - Scan to record transfers
   - Mobile app for stock movements

2. **Automatic Rebalancing Suggestions**
   - AI suggests optimal stock distribution
   - Auto-create transfer requests

3. **Mobile Vehicle Tracking**
   - GPS tracking for mobile locations (tour vehicles)
   - Real-time stock on vehicles

4. **Location Capacity Alerts**
   - Warn when location is near capacity
   - Suggest moving to larger location

5. **Location-Based Costing**
   - Different costs per location
   - Transfer costs between locations

---

## 7. INVENTORY VALUATION METHODS

### Current Problem
❌ Valuation methods (FIFO, LIFO, Average, Standard) are displayed in UI but **NOT actually implemented**  
❌ All methods return the same value: `quantity × cost_price`  
❌ **Total Value displaying NaN** - Missing properties in API response (fixed: added fifoValue, lifoValue, averageCost, standardCost)  
❌ No cost layer tracking in database  
❌ No purchase history tracking for FIFO/LIFO calculations  
❌ Cannot generate accurate COGS (Cost of Goods Sold) reports

**Recent Fix (Dec 18, 2025):**
✅ Added missing valuation properties to API response to prevent NaN display  
✅ Added fallback values in frontend calculation function  
⚠️ **Note:** All valuation methods still return same value until cost layer tracking is implemented  

### Why Valuation Methods Matter

Different valuation methods affect:
- **Financial reporting** (balance sheet inventory value)
- **Tax calculations** (COGS affects taxable income)
- **Profitability analysis** (gross margins)
- **Inventory turnover ratios**
- **Pricing decisions**

**Example:**
```
Purchase History:
- Jan 1: Buy 100 units @ $10 = $1,000
- Feb 1: Buy 100 units @ $12 = $1,200
- Mar 1: Sell 150 units

FIFO (First In, First Out):
  COGS = (100 × $10) + (50 × $12) = $1,600
  Remaining Inventory = 50 units @ $12 = $600

LIFO (Last In, First Out):
  COGS = (100 × $12) + (50 × $10) = $1,700
  Remaining Inventory = 50 units @ $10 = $500

Average Cost:
  Average = ($1,000 + $1,200) / 200 = $11/unit
  COGS = 150 × $11 = $1,650
  Remaining Inventory = 50 × $11 = $550
```

---

### Solution Overview

Implement **proper cost layer tracking** to support all valuation methods.

---

### A. Database Schema for Cost Layers

#### Inventory Cost Layers Table (New)
```sql
CREATE TABLE inventory_cost_layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id),
  
  -- Cost Layer Details
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'adjustment', 'transfer_in', 'production'
  transaction_id UUID, -- Links to purchase order, adjustment, etc.
  transaction_date DATE NOT NULL,
  
  -- Quantities
  quantity_received DECIMAL(15,4) NOT NULL,
  quantity_remaining DECIMAL(15,4) NOT NULL,
  quantity_used DECIMAL(15,4) GENERATED ALWAYS AS (quantity_received - quantity_remaining) STORED,
  
  -- Costing
  unit_cost DECIMAL(15,2) NOT NULL, -- In product's currency
  unit_cost_usd DECIMAL(15,2), -- Converted to USD for reporting
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity_received * unit_cost) STORED,
  remaining_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity_remaining * unit_cost) STORED,
  
  -- Tracking
  lot_number VARCHAR(100),
  batch_number VARCHAR(100),
  serial_numbers TEXT[],
  
  -- Status
  is_depleted BOOLEAN GENERATED ALWAYS AS (quantity_remaining <= 0) STORED,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_cost_layers_product ON inventory_cost_layers(product_id);
CREATE INDEX idx_cost_layers_location ON inventory_cost_layers(location_id);
CREATE INDEX idx_cost_layers_date ON inventory_cost_layers(transaction_date);
CREATE INDEX idx_cost_layers_not_depleted ON inventory_cost_layers(product_id, location_id) 
  WHERE quantity_remaining > 0;
CREATE INDEX idx_cost_layers_fifo ON inventory_cost_layers(product_id, location_id, transaction_date) 
  WHERE quantity_remaining > 0;
CREATE INDEX idx_cost_layers_lifo ON inventory_cost_layers(product_id, location_id, transaction_date DESC) 
  WHERE quantity_remaining > 0;

COMMENT ON TABLE inventory_cost_layers IS 'Track cost layers for FIFO/LIFO/Average cost calculations';
```

#### Inventory Transactions Table (Enhanced)
```sql
-- Add to existing inventory_movements or create new table
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  location_id UUID REFERENCES inventory_locations(id),
  
  -- Transaction Details
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, 
  -- 'purchase', 'sale', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'return', 'write_off'
  transaction_date DATE NOT NULL,
  reference_type VARCHAR(50), -- 'invoice', 'bill', 'po', 'adjustment', 'transfer'
  reference_id UUID, -- Link to source document
  
  -- Quantities
  quantity DECIMAL(15,4) NOT NULL, -- Positive for in, negative for out
  quantity_before DECIMAL(15,4),
  quantity_after DECIMAL(15,4),
  
  -- Costing
  unit_cost DECIMAL(15,2),
  total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  
  -- Valuation Method Used
  valuation_method VARCHAR(50), -- 'fifo', 'lifo', 'average', 'standard'
  cost_layers_affected JSONB, -- Which cost layers were consumed
  
  -- User & Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX idx_inventory_transactions_company ON inventory_transactions(company_id);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_location ON inventory_transactions(location_id);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);

COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory movements with costing';
```

#### Add Valuation Method to Products Table
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS valuation_method VARCHAR(50) DEFAULT 'fifo';
-- Options: 'fifo', 'lifo', 'average', 'standard'

ALTER TABLE products ADD COLUMN IF NOT EXISTS standard_cost DECIMAL(15,2);
-- For standard costing method

COMMENT ON COLUMN products.valuation_method IS 'Inventory costing method for this product';
COMMENT ON COLUMN products.standard_cost IS 'Standard/budgeted cost for standard costing method';

CREATE INDEX idx_products_valuation_method ON products(valuation_method);
```

---

### B. Implementation Details by Method

#### 1. FIFO (First In, First Out)

**Principle:** Oldest inventory is sold first

**Algorithm:**
```typescript
function calculateFIFOCost(productId: string, quantityToConsume: number) {
  // Get cost layers ordered by oldest first
  const layers = getCostLayers(productId, 'ORDER BY transaction_date ASC');
  
  let remainingQty = quantityToConsume;
  let totalCost = 0;
  const layersUsed = [];
  
  for (const layer of layers) {
    if (remainingQty <= 0) break;
    
    const qtyFromThisLayer = Math.min(layer.quantity_remaining, remainingQty);
    totalCost += qtyFromThisLayer * layer.unit_cost;
    
    layersUsed.push({
      layerId: layer.id,
      quantityUsed: qtyFromThisLayer,
      unitCost: layer.unit_cost
    });
    
    remainingQty -= qtyFromThisLayer;
  }
  
  return {
    totalCost,
    averageUnitCost: totalCost / quantityToConsume,
    layersUsed
  };
}
```

**When to Use:**
- ✅ Perishable goods (food, medical supplies)
- ✅ Items with expiry dates
- ✅ Inflationary environments (lower COGS → higher profit)
- ✅ Most common method, conservative approach

**Example:**
```
Purchases:
- Jan 1: 50 tents @ $100 = $5,000
- Feb 1: 50 tents @ $120 = $6,000

Sell 60 tents on Mar 1:
FIFO COGS = (50 × $100) + (10 × $120) = $6,200
Remaining: 40 tents @ $120 = $4,800
```

---

#### 2. LIFO (Last In, First Out)

**Principle:** Newest inventory is sold first

**Algorithm:**
```typescript
function calculateLIFOCost(productId: string, quantityToConsume: number) {
  // Get cost layers ordered by newest first
  const layers = getCostLayers(productId, 'ORDER BY transaction_date DESC');
  
  let remainingQty = quantityToConsume;
  let totalCost = 0;
  const layersUsed = [];
  
  for (const layer of layers) {
    if (remainingQty <= 0) break;
    
    const qtyFromThisLayer = Math.min(layer.quantity_remaining, remainingQty);
    totalCost += qtyFromThisLayer * layer.unit_cost;
    
    layersUsed.push({
      layerId: layer.id,
      quantityUsed: qtyFromThisLayer,
      unitCost: layer.unit_cost
    });
    
    remainingQty -= qtyFromThisLayer;
  }
  
  return {
    totalCost,
    averageUnitCost: totalCost / quantityToConsume,
    layersUsed
  };
}
```

**When to Use:**
- ✅ Tax benefits in inflationary periods (higher COGS → lower taxable income)
- ✅ Non-perishable items with stable shelf life
- ❌ **NOT allowed under IFRS** (International Financial Reporting Standards)
- ⚠️ **Restricted in some countries** including Uganda (check local tax authority)

**Example:**
```
Purchases:
- Jan 1: 50 tents @ $100 = $5,000
- Feb 1: 50 tents @ $120 = $6,000

Sell 60 tents on Mar 1:
LIFO COGS = (50 × $120) + (10 × $100) = $7,000
Remaining: 40 tents @ $100 = $4,000
```

---

#### 3. Weighted Average Cost

**Principle:** Average cost of all units available

**Algorithm:**
```typescript
function calculateAverageCost(productId: string, quantityToConsume: number) {
  // Get all cost layers
  const layers = getCostLayers(productId);
  
  const totalQuantity = layers.reduce((sum, l) => sum + l.quantity_remaining, 0);
  const totalValue = layers.reduce((sum, l) => sum + (l.quantity_remaining * l.unit_cost), 0);
  
  const averageUnitCost = totalValue / totalQuantity;
  const totalCost = quantityToConsume * averageUnitCost;
  
  // Reduce proportionally from all layers
  const layersUsed = layers.map(layer => ({
    layerId: layer.id,
    quantityUsed: (layer.quantity_remaining / totalQuantity) * quantityToConsume,
    unitCost: averageUnitCost
  }));
  
  return {
    totalCost,
    averageUnitCost,
    layersUsed
  };
}
```

**When to Use:**
- ✅ Interchangeable/homogeneous items (commodities)
- ✅ Simplicity - easiest to understand and implement
- ✅ Smooths out price fluctuations
- ✅ Good for items with frequent price changes

**Example:**
```
Purchases:
- Jan 1: 50 tents @ $100 = $5,000
- Feb 1: 50 tents @ $120 = $6,000

Average Cost = $11,000 / 100 = $110/unit

Sell 60 tents on Mar 1:
Average COGS = 60 × $110 = $6,600
Remaining: 40 tents × $110 = $4,400
```

---

#### 4. Standard Cost

**Principle:** Predetermined/budgeted cost

**Algorithm:**
```typescript
function calculateStandardCost(productId: string, quantityToConsume: number) {
  const product = getProduct(productId);
  const standardCost = product.standard_cost;
  const totalCost = quantityToConsume * standardCost;
  
  // Calculate variance from actual costs
  const actualCost = calculateActualCost(productId, quantityToConsume);
  const variance = totalCost - actualCost.totalCost;
  
  return {
    totalCost,
    averageUnitCost: standardCost,
    variance,
    varianceType: variance > 0 ? 'favorable' : 'unfavorable'
  };
}
```

**When to Use:**
- ✅ Manufacturing environments
- ✅ Cost control and variance analysis
- ✅ Budgeting and planning
- ✅ Performance measurement
- ❌ Requires regular variance reconciliation

**Example:**
```
Standard Cost: $110/tent (set at beginning of year)

Actual Purchases:
- Jan 1: 50 tents @ $100 = $5,000
- Feb 1: 50 tents @ $120 = $6,000

Sell 60 tents on Mar 1:
Standard COGS = 60 × $110 = $6,600
Actual Average = (50×$100 + 50×$120)/100 = $110
Variance = $0 (no variance in this example)
```

---

### C. API Endpoints for Valuation

#### 1. Calculate Inventory Valuation

**GET /api/inventory/valuation**
```typescript
Query params: 
  - productId?: UUID
  - locationId?: UUID
  - asOfDate?: Date
  - method: 'fifo' | 'lifo' | 'average' | 'standard'
  - includeDetails?: boolean

Response: {
  method: "fifo",
  asOfDate: "2024-12-18",
  products: [
    {
      productId: "uuid",
      productName: "Camping Tent",
      quantityOnHand: 100,
      valuationDetails: {
        fifo: {
          totalValue: 11000.00,
          averageUnitCost: 110.00,
          costLayers: [
            { date: "2024-01-01", qty: 50, cost: 100, value: 5000 },
            { date: "2024-02-01", qty: 50, cost: 120, value: 6000 }
          ]
        },
        lifo: {
          totalValue: 10500.00,
          averageUnitCost: 105.00
        },
        average: {
          totalValue: 11000.00,
          averageUnitCost: 110.00
        },
        standard: {
          totalValue: 11500.00,
          standardUnitCost: 115.00,
          variance: 500.00,
          varianceType: "unfavorable"
        }
      }
    }
  ],
  summary: {
    totalValueFIFO: 11000.00,
    totalValueLIFO: 10500.00,
    totalValueAverage: 11000.00,
    totalValueStandard: 11500.00,
    methodDifference: 500.00,
    recommendedMethod: "fifo"
  }
}
```

#### 2. Record Inventory Transaction (With Cost Layer Update)

**POST /api/inventory/transactions**
```typescript
Body: {
  productId: "uuid",
  locationId: "uuid",
  transactionType: "sale",
  quantity: -60, // Negative for sale/consumption
  transactionDate: "2024-03-01",
  referenceType: "invoice",
  referenceId: "invoice-uuid",
  valuationMethod: "fifo", // Use product's default if not specified
  notes: "Sale to customer XYZ"
}

// Backend will:
// 1. Calculate cost using specified method
// 2. Update cost layers (reduce quantity_remaining)
// 3. Record transaction with cost details
// 4. Update product quantity
// 5. Create accounting journal entries (COGS debit, Inventory credit)

Response: {
  transactionId: "uuid",
  costCalculation: {
    quantitySold: 60,
    totalCost: 6200.00,
    averageUnitCost: 103.33,
    layersUsed: [
      { layerId: "uuid-1", qtyUsed: 50, unitCost: 100 },
      { layerId: "uuid-2", qtyUsed: 10, unitCost: 120 }
    ]
  },
  journalEntry: {
    debit: { account: "Cost of Goods Sold", amount: 6200 },
    credit: { account: "Inventory", amount: 6200 }
  }
}
```

---

### D. Database Triggers for Automation

#### 1. Auto-create Cost Layer on Purchase
```sql
CREATE OR REPLACE FUNCTION create_cost_layer_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- When a purchase (bill) is created, create cost layer
  IF NEW.transaction_type = 'purchase' THEN
    INSERT INTO inventory_cost_layers (
      product_id,
      location_id,
      transaction_type,
      transaction_id,
      transaction_date,
      quantity_received,
      quantity_remaining,
      unit_cost,
      unit_cost_usd
    ) VALUES (
      NEW.product_id,
      NEW.location_id,
      'purchase',
      NEW.id,
      NEW.transaction_date,
      NEW.quantity,
      NEW.quantity, -- Initially all remaining
      NEW.unit_cost,
      NEW.unit_cost_usd
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_cost_layer
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type = 'purchase')
  EXECUTE FUNCTION create_cost_layer_on_purchase();
```

#### 2. Update Average Cost on Product
```sql
CREATE OR REPLACE FUNCTION update_product_average_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average cost for the product
  UPDATE products p
  SET cost_price = (
    SELECT SUM(quantity_remaining * unit_cost) / NULLIF(SUM(quantity_remaining), 0)
    FROM inventory_cost_layers
    WHERE product_id = NEW.product_id
      AND quantity_remaining > 0
  )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_average_cost
  AFTER INSERT OR UPDATE ON inventory_cost_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_product_average_cost();
```

---

### E. UI Updates Required

#### 1. Product Settings - Add Valuation Method Selection
```
┌─────────────────────────────────────────────┐
│ Costing & Valuation                         │
├─────────────────────────────────────────────┤
│ Valuation Method:                           │
│ ○ FIFO (First In, First Out)               │
│   Best for perishables, most common        │
│                                             │
│ ○ LIFO (Last In, First Out)                │
│   ⚠️ Not allowed under IFRS                │
│                                             │
│ ○ Weighted Average                          │
│   Simple, smooths price changes            │
│                                             │
│ ○ Standard Cost                             │
│   For manufacturing & budgeting            │
│   Standard Cost: [$115.00]                 │
│                                             │
│ Current Average Cost: $110.00               │
│ Last Purchase Cost: $120.00                 │
└─────────────────────────────────────────────┘
```

#### 2. Inventory Valuation Report - Show Cost Layers
```
┌─────────────────────────────────────────────┐
│ Camping Tent (SKU: TENT-001)                │
├─────────────────────────────────────────────┤
│ Quantity on Hand: 100 units                 │
│ Valuation Method: FIFO                      │
│                                             │
│ Cost Layers:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Date       Qty   Unit Cost    Value    │ │
│ ├─────────────────────────────────────────┤ │
│ │ Jan 1      50    $100.00      $5,000   │ │
│ │ Feb 1      50    $120.00      $6,000   │ │
│ │                                         │ │
│ │ Total      100                $11,000  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Valuation Comparison:                       │
│ • FIFO:     $11,000 ✓ (Selected)           │
│ • LIFO:     $10,500 ($500 lower)           │
│ • Average:  $11,000 (Same as FIFO)         │
│ • Standard: $11,500 ($500 higher)          │
│                                             │
│ [View Cost History] [Export Layers]         │
└─────────────────────────────────────────────┘
```

#### 3. Transaction History - Show Cost Calculations
```
┌─────────────────────────────────────────────┐
│ Transaction: INV-001 (Sale)                 │
├─────────────────────────────────────────────┤
│ Date: Mar 1, 2024                           │
│ Quantity Sold: 60 units                     │
│                                             │
│ Cost Calculation (FIFO):                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Layer         Qty Used   Cost      Total│ │
│ ├─────────────────────────────────────────┤ │
│ │ Jan 1 Layer   50         $100      $5K  │ │
│ │ Feb 1 Layer   10         $120      $1.2K│ │
│ │                                         │ │
│ │ Total COGS              $103.33    $6.2K│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Sale Price: 60 × $150 = $9,000             │
│ Cost of Goods Sold: $6,200                 │
│ Gross Profit: $2,800 (31.1%)               │
└─────────────────────────────────────────────┘
```

---

### F. Implementation Phases

#### Phase 1: Database & Core Logic (Week 1-2)
1. Create `inventory_cost_layers` table
2. Create `inventory_transactions` table
3. Add `valuation_method` to products table
4. Create database functions for FIFO/LIFO/Average calculations
5. Create triggers for automatic cost layer management
6. Migrate existing inventory to initial cost layers

#### Phase 2: API Development (Week 3)
1. Build cost calculation functions (FIFO, LIFO, Average, Standard)
2. Update inventory transaction API to record cost layers
3. Create valuation comparison API endpoint
4. Update inventory valuation report API to use actual methods
5. Add cost layer query endpoints

#### Phase 3: UI Integration (Week 4)
1. Add valuation method selector to product settings
2. Update inventory valuation report with cost layer details
3. Add valuation comparison view
4. Show cost calculations in transaction history
5. Add cost layer drill-down views

#### Phase 4: Testing & Validation (Week 5)
1. Test each valuation method with sample data
2. Verify cost layer accuracy
3. Test edge cases (negative inventory, adjustments, transfers)
4. Validate accounting journal entries
5. Performance testing with large datasets

#### Phase 5: Migration & Go-Live (Week 6)
1. Backfill cost layers from historical data
2. Reconcile with current inventory values
3. User training on valuation methods
4. Deploy to production
5. Monitor and adjust

---

### G. Recommended Approach for Sceneside

**For Tourism Business:**

1. **Consumables (fuel, food, supplies):**
   - ✅ **Use FIFO** - Perishable items, prevent wastage

2. **Reusable Equipment (tents, sleeping bags):**
   - ✅ **Use Weighted Average** - Simplicity, equipment is interchangeable

3. **Merchandise (T-shirts, souvenirs):**
   - ✅ **Use FIFO** - Fashion items age, older stock should sell first

4. **Spare Parts:**
   - ✅ **Use Weighted Average** - Parts are fungible

5. **Company-Wide Default:**
   - ✅ **Use FIFO** as default - Most conservative, widely accepted

**Rationale:**
- FIFO is accepted worldwide (IFRS compliant)
- Matches physical flow of goods (especially for tours)
- Provides conservative inventory valuation
- Simplifies tax compliance in Uganda

---

### H. Benefits of Proper Implementation

#### Accounting Benefits
✅ Accurate COGS calculation  
✅ Correct inventory valuation on balance sheet  
✅ Proper gross profit reporting  
✅ Tax compliance with valuation method disclosure  

#### Operational Benefits
✅ Track which purchases are being consumed  
✅ Identify slow-moving stock layers  
✅ Analyze price variance impacts  
✅ Better purchasing decisions based on cost trends  

#### Financial Analysis
✅ Compare profitability across valuation methods  
✅ Understand tax implications of method choice  
✅ Calculate inventory turnover accurately  
✅ Forecast cash flow impact of inventory purchases  

---

## 8. DATABASE CHANGES REQUIRED

### Migration 023: Inventory System Redesign & Location Management

#### A. Update Product Types
```sql
-- Change product_type from enum to allow new types
ALTER TYPE product_type ADD VALUE 'stock' IF NOT EXISTS;
ALTER TYPE product_type ADD VALUE 'reusable' IF NOT EXISTS;
ALTER TYPE product_type ADD VALUE 'permit' IF NOT EXISTS;
ALTER TYPE product_type ADD VALUE 'tour_product' IF NOT EXISTS;

-- Update existing 'inventory' to 'stock'
UPDATE products 
SET product_type = 'stock' 
WHERE product_type = 'inventory' AND track_inventory = true;
```

#### B. Add Physical Stock Fields
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_type VARCHAR(50); 
-- 'consumable', 'reusable', 'merchandise', 'spare_parts'

ALTER TABLE products ADD COLUMN IF NOT EXISTS condition_status VARCHAR(50);
-- 'new', 'good', 'fair', 'needs_repair', 'out_of_service'

ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currently_assigned_to VARCHAR(255);
```

#### C. Add Tour Product Fields
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS booked_capacity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_capacity INTEGER 
  GENERATED ALWAYS AS (COALESCE(capacity, 0) - COALESCE(booked_capacity, 0)) STORED;
ALTER TABLE products ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inclusions TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS exclusions TEXT[];
```

#### D. Add Permit Fields
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS renewal_frequency VARCHAR(50);
-- 'annual', 'quarterly', 'monthly', 'one-time'

ALTER TABLE products ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS renewal_reminder_days INTEGER DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_tour_ids UUID[];
```

#### E. Add Product Variants Table (for merchandise)
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255), -- e.g., "Small/Red"
  attributes JSONB, -- {"size": "Small", "color": "Red"}
  sku VARCHAR(100) UNIQUE,
  quantity_on_hand DECIMAL(15,4) DEFAULT 0,
  additional_cost DECIMAL(15,2) DEFAULT 0, -- price difference from base
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### F. Add Tour Product Schedules Table
```sql
CREATE TABLE tour_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_capacity INTEGER NOT NULL,
  booked_capacity INTEGER DEFAULT 0,
  available_capacity INTEGER GENERATED ALWAYS AS (total_capacity - booked_capacity) STORED,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'nearly_full', 'sold_out', 'completed', 'cancelled'
  guide_assigned UUID REFERENCES contacts(id),
  vehicle_assigned UUID REFERENCES assets(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. USER INTERFACE CHANGES

### Dashboard Navigation Updates

**Current:** Inventory (single menu item)

**New Structure:**
```
Inventory (parent menu)
├── Physical Stock
│   ├── Consumables
│   ├── Reusable Equipment
│   ├── Merchandise
│   └── Spare Parts
├── Tour Products
│   ├── All Tours
│   ├── Schedules & Capacity
│   └── Bookings
├── Permits & Licenses
│   ├── Active Permits
│   ├── Expiring Soon
│   └── Renewal Tracker
└── Inventory Summary
    └── Complete Overview
```

### New Pages Required

1. **Physical Stock Pages**
   - `/dashboard/inventory/stock/consumables`
   - `/dashboard/inventory/stock/reusables`
   - `/dashboard/inventory/stock/merchandise`
   - `/dashboard/inventory/stock/spare-parts`

2. **Tour Products Pages**
   - `/dashboard/inventory/tours`
   - `/dashboard/inventory/tours/[id]/schedules`
   - `/dashboard/inventory/tours/capacity-planner`

3. **Permits Pages**
   - `/dashboard/inventory/permits`
   - `/dashboard/inventory/permits/renewals`
   - `/dashboard/inventory/permits/[id]`

4. **Inventory Summary**
   - `/dashboard/inventory/summary` (enhanced overview)

---

## 8. REPORTS TO UPDATE

### A. Inventory Valuation Report
**Updates:**
- Separate sections for each inventory type
- Physical stock valued at cost
- Assets valued at book value (depreciated)
- Tour products show capacity, not monetary value
- Permits show status and expiry

### B. New Reports Needed

**1. Tour Capacity Report**
```
Shows:
- Available capacity by tour/date
- Booking trends
- Occupancy rates
- Revenue per available seat
```

**2. Permit Expiry Report**
```
Shows:
- All permits with expiry dates
- Alerts for permits expiring <30 days
- Renewal costs
- Action items
```

**3. Reusable Equipment Status**
```
Shows:
- Equipment condition
- Maintenance due
- Currently assigned items
- Replacement recommendations
```

**4. Stock Consumption Analysis**
```
Shows:
- Consumables used per tour
- Cost per tour based on consumption
- Reorder patterns
- Waste reduction opportunities
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Database Migration (Week 1)
- Create migration 023
- Add new columns to products table
- Create product_variants table
- Create tour_schedules table
- Update existing data

### Phase 2: Physical Stock (Week 2-3)
- Update inventory pages with stock types
- Add batch/expiry tracking
- Implement condition tracking for reusables
- Add variant support for merchandise
- Link spare parts to assets

### Phase 3: Tour Products (Week 4-5)
- Create tour product pages
- Build capacity management system
- Add schedule/date-based availability
- Integrate with booking system

### Phase 4: Permits & Licenses (Week 6)
- Create permits management pages
- Add expiry tracking and alerts
- Build renewal reminder system
- Link permits to tours

### Phase 5: Dashboards & Reports (Week 7-8)
- Update inventory summary dashboard
- Create new reports
- Add analytics and insights
- Testing and refinement

---

## 10. BENEFITS OF NEW SYSTEM

### Accounting Compliance
✅ Properly distinguishes stock from inventory
✅ Accurate valuation methods per category
✅ COGS tracking for consumables and merchandise
✅ Depreciation for reusable equipment

### Operational Efficiency
✅ Real-time tour capacity management
✅ Automated permit renewal reminders
✅ Equipment maintenance tracking
✅ Low stock alerts

### Business Intelligence
✅ Occupancy rate analytics
✅ Consumption patterns per tour
✅ Equipment utilization rates
✅ Permit cost allocation to tours

### Tour Operations
✅ Know available seats instantly
✅ Track permit allocation per tour
✅ Equipment checkout system
✅ Maintenance scheduling

---

## 11. NEXT STEPS

1. **Review & Approve** this plan
2. **Prioritize features** (which to implement first)
3. **Create database migration** (Phase 1)
4. **Build UI components** (Phases 2-4)
5. **Test with sample data**
6. **Train users on new system**
7. **Go live with new inventory structure**

---

## Questions for Final Approval

1. Should we implement all phases or prioritize certain inventory types?
2. Do you want merchandise variants now or in a future phase?
3. Should tour schedules integrate with existing booking system immediately?
4. Any additional fields needed for permits or equipment tracking?

---

**Document Created:** December 18, 2025  
**Status:** Pending Approval  
**Estimated Implementation Time:** 8 weeks  
**Priority:** High - Improves accounting accuracy and operational efficiency

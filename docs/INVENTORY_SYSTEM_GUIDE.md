# Sceneside Inventory System Guide

## Overview

The inventory system has been completely redesigned to handle the diverse needs of Sceneside's tourism business. It now supports four main types of inventory:

1. **Physical Stock** - Items you buy, sell, or use (consumables, merchandise, spare parts)
2. **Tour Products** - Capacity-based services like desert safaris, city tours
3. **Permits & Licenses** - Government permits with quotas and expiry dates
4. **Equipment** - Reusable items like vehicles, cameras, tents

---

## Inventory Categories Explained

### 1. Physical Stock (Consumable & Merchandise)

These are traditional inventory items with quantities that go up and down.

**Stock Types:**
| Type | Description | Example |
|------|-------------|---------|
| `consumable` | Used once, then gone | Water bottles, snacks, fuel |
| `reusable` | Used multiple times | Camping gear, life jackets |
| `merchandise` | Items for resale | Souvenirs, branded t-shirts |
| `spare_part` | Replacement parts | Vehicle parts, equipment spares |

**How it works:**
- When you receive items → Quantity increases
- When you sell items (invoice) → Quantity automatically decreases
- System tracks cost using FIFO (First In, First Out) by default

### 2. Tour Products (Capacity-Based)

Tours don't have physical stock - they have **capacity** (seats/spots available).

**Example: Desert Safari Tour**
- Maximum 10 participants per tour
- When someone books 3 spots → Available capacity becomes 7
- System prevents overbooking

**Key Fields:**
- `max_participants` - Maximum people per tour
- `min_participants` - Minimum needed to run the tour
- `duration_hours` - How long the tour lasts
- `difficulty_level` - easy, moderate, difficult, expert
- `included_items` - What's included (food, transport, etc.)
- `required_equipment` - Gear needed for the tour

### 3. Permits & Licenses

Track government permits, licenses, and quotas.

**Example: National Park Entry Permit**
- Valid from Jan 1, 2025 to Dec 31, 2025
- Annual quota: 1000 entries
- Each tour uses some of this quota

**Key Fields:**
- `permit_number` - Official permit ID
- `issuing_authority` - Who issued it (e.g., "Tourism Department")
- `valid_from` / `valid_until` - Validity period
- `annual_quota` - Total allowed usage per year
- `used_quota` - How much has been used
- `renewal_reminder_days` - Days before expiry to get reminded

**Status Tracking:**
- `active` - Currently valid
- `expired` - Past validity date
- `pending_renewal` - Awaiting renewal
- `suspended` - Temporarily inactive

### 4. Equipment (Reusable Items)

Track items that are used repeatedly and need maintenance.

**Example: Safari Vehicle**
- Serial number: VH-2024-001
- Condition: Good
- Last maintenance: Nov 15, 2024
- Next maintenance due: Feb 15, 2025

**Key Fields:**
- `serial_number` - Unique identifier
- `item_condition` - new, good, fair, poor, needs_repair, retired
- `purchase_date` - When acquired
- `warranty_expiry` - Warranty end date
- `maintenance_interval_days` - How often to service
- `last_maintenance_date` - Last service date
- `usage_count` - Times used

---

## Multi-Location Support

You can now track inventory across multiple locations.

### Location Types
- `warehouse` - Main storage facility
- `office` - Office location
- `vehicle` - Mobile storage (delivery van, tour bus)
- `other` - Any other location

### How It Works

**Setting Up Locations:**
1. Create locations in the system (e.g., "Main Warehouse", "Downtown Office")
2. Set one as the default location
3. All existing products are automatically assigned to the default location

**Stock by Location:**
- Product A: 50 units at Main Warehouse, 20 units at Downtown Office
- Total inventory shows as 70 units
- Each location has its own stock count

### Stock Transfers

Move inventory between locations:

1. **Create Transfer** - Specify source, destination, items, quantities
2. **Ship Transfer** - Items leave source location
3. **Receive Transfer** - Items arrive at destination

**Transfer Statuses:**
- `pending` - Created but not started
- `in_transit` - Shipped, awaiting delivery
- `completed` - Received at destination
- `cancelled` - Transfer cancelled

---

## Inventory Costing (FIFO/LIFO/Average)

The system tracks the **cost** of inventory, not just quantity.

### Why This Matters

You buy the same product at different prices over time:
- January: Bought 100 units at $10 each
- March: Bought 100 units at $12 each
- April: Sold 50 units - at what cost?

### Costing Methods

**FIFO (First In, First Out)** - Default
- Oldest inventory sold first
- April sale uses January's $10 cost
- Best for perishable items

**LIFO (Last In, First Out)**
- Newest inventory sold first
- April sale uses March's $12 cost
- Reduces taxes when prices rise

**Average Cost**
- Uses weighted average of all purchases
- April sale at $11 average cost
- Simplest to understand

### Cost Layers

The system maintains "cost layers" - batches of inventory at specific costs:

| Layer | Date Received | Quantity | Unit Cost | Remaining |
|-------|---------------|----------|-----------|-----------|
| 1 | Jan 15 | 100 | $10.00 | 50 |
| 2 | Mar 10 | 100 | $12.00 | 100 |

When you sell 50 units (FIFO):
- Layer 1 remaining drops from 100 to 50
- Cost of Goods Sold = 50 × $10 = $500

---

## Invoice Integration

### Automatic Stock Deduction

When you create an invoice and change its status from **Draft** to **Sent**:

1. System checks each line item
2. For physical stock items → Quantity is reduced
3. For tour products → Booking is created
4. COGS (Cost of Goods Sold) journal entry is created automatically

### What Happens Step by Step

**Creating an Invoice:**
```
Invoice #INV-2025-001
- 5x Water Bottles ($2 each) = $10
- 1x Desert Safari ($150) = $150
Total: $160
Status: DRAFT
```
→ No inventory changes yet (it's just a draft)

**Sending the Invoice:**
```
Status changed: DRAFT → SENT
```
→ System automatically:
1. Deducts 5 water bottles from inventory
2. Creates tour booking for Desert Safari
3. Creates journal entry: DR COGS $5, CR Inventory $5

### Voiding an Invoice

If you void a sent/paid invoice:
1. Inventory quantities are **restored**
2. Tour bookings are **cancelled**
3. COGS journal entry is **reversed**

---

## Tour Schedules & Bookings

### Tour Schedules

A tour product can have multiple scheduled dates:

| Date | Time | Max Capacity | Booked | Available |
|------|------|--------------|--------|-----------|
| Dec 20 | 9:00 AM | 10 | 6 | 4 |
| Dec 21 | 9:00 AM | 10 | 0 | 10 |
| Dec 22 | 2:00 PM | 10 | 10 | 0 (FULL) |

### Bookings

When a customer books a tour:
- Creates a booking record linked to the schedule
- Reduces available capacity
- Links to the invoice

**Booking Statuses:**
- `pending` - Awaiting confirmation
- `confirmed` - Booking confirmed
- `checked_in` - Customer arrived
- `completed` - Tour finished
- `no_show` - Customer didn't show
- `cancelled` - Booking cancelled

---

## Equipment Management

### Assignments

Track who is using what equipment:

```
Vehicle VH-2024-001
├── Assigned to: Ahmed (Guide)
├── Assigned for: Desert Safari Tour
├── Checkout: Dec 18, 2025 8:00 AM
├── Expected Return: Dec 18, 2025 6:00 PM
└── Status: In Use
```

### Maintenance Tracking

Log all maintenance activities:

| Date | Type | Description | Cost | Next Due |
|------|------|-------------|------|----------|
| Nov 15, 2024 | scheduled | Oil change, tire rotation | $250 | Feb 15, 2025 |
| Oct 3, 2024 | repair | Fixed AC | $180 | - |

**Maintenance Types:**
- `scheduled` - Regular maintenance
- `repair` - Fixing something broken
- `inspection` - Safety check
- `cleaning` - Deep cleaning
- `upgrade` - Adding improvements

---

## API Endpoints Reference

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/locations` | List all locations |
| POST | `/api/inventory/locations` | Create location |
| GET | `/api/inventory/locations/[id]` | Get location details |
| PATCH | `/api/inventory/locations/[id]` | Update location |
| DELETE | `/api/inventory/locations/[id]` | Delete location |
| GET | `/api/inventory/locations/[id]/stock` | Get stock at location |

### Stock Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/transfers` | List transfers |
| POST | `/api/inventory/transfers` | Create transfer |
| GET | `/api/inventory/transfers/[id]` | Get transfer details |
| POST | `/api/inventory/transfers/[id]/ship` | Ship transfer |
| POST | `/api/inventory/transfers/[id]/receive` | Receive transfer |
| DELETE | `/api/inventory/transfers/[id]` | Cancel transfer |

### Inventory Valuation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/valuation` | Get inventory value |

Query params: `method` (fifo/lifo/average), `as_of_date`

### Tour Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/tours` | List tour schedules |
| POST | `/api/inventory/tours` | Create schedule |
| GET | `/api/inventory/tours/[id]` | Get schedule details |
| PATCH | `/api/inventory/tours/[id]` | Update schedule |
| DELETE | `/api/inventory/tours/[id]` | Cancel schedule |
| GET | `/api/inventory/tours/[id]/bookings` | Get bookings |
| POST | `/api/inventory/tours/[id]/bookings` | Create booking |

### Permits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/permits` | List permits |
| POST | `/api/inventory/permits` | Create permit |
| GET | `/api/inventory/permits/[id]` | Get permit details |
| PATCH | `/api/inventory/permits/[id]` | Update permit |
| DELETE | `/api/inventory/permits/[id]` | Delete permit |

### Equipment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/equipment` | List equipment |
| POST | `/api/inventory/equipment` | Create equipment |
| GET | `/api/inventory/equipment/[id]` | Get equipment details |
| PATCH | `/api/inventory/equipment/[id]` | Update equipment |
| DELETE | `/api/inventory/equipment/[id]` | Delete equipment |
| POST | `/api/inventory/equipment/[id]/assign` | Checkout/return equipment |
| POST | `/api/inventory/equipment/[id]/maintenance` | Log maintenance |

---

## Dashboard Usage

### Inventory Page Tabs

The inventory dashboard now has 5 tabs:

1. **All Items** - Everything in one view
2. **Physical Stock** - Consumables, merchandise, spare parts
3. **Tour Products** - All tour offerings
4. **Permits & Licenses** - Track permits and quotas
5. **Equipment** - Reusable items and their status

### Creating New Items

When creating a new inventory item:

1. Select the **Inventory Category** first
2. Form dynamically shows relevant fields:
   - Physical Stock → Shows stock type, reorder level, unit of measure
   - Tour Product → Shows duration, participants, difficulty, included items
   - Permit → Shows permit number, authority, validity dates, quota

### Summary Cards

Each tab shows relevant statistics:
- **Physical Stock**: Low stock alerts, total value
- **Tours**: Upcoming schedules, available capacity
- **Permits**: Expiring soon, quota usage
- **Equipment**: Items needing maintenance, currently assigned

---

## Database Tables Reference

### New Tables Created

| Table | Purpose |
|-------|---------|
| `inventory_locations` | Warehouses, offices, vehicles |
| `product_stock_locations` | Stock quantity per location |
| `stock_transfers` | Transfer headers |
| `stock_transfer_items` | Transfer line items |
| `inventory_cost_layers` | FIFO/LIFO cost tracking |
| `inventory_transactions` | Audit trail of all movements |
| `tour_schedules` | Scheduled tour dates |
| `tour_bookings` | Customer bookings |
| `permit_allocations` | Permit usage records |
| `equipment_assignments` | Equipment checkout records |
| `maintenance_records` | Equipment maintenance log |
| `product_variants` | Size/color variations for merchandise |

### Enhanced Products Table

The `products` table now includes 40+ new columns to support all inventory categories. Key additions:

- `inventory_category` - physical_stock, tour_product, permit
- `stock_type` - consumable, reusable, merchandise, spare_part
- `valuation_method` - fifo, lifo, average
- Tour fields: `duration_hours`, `max_participants`, `difficulty_level`
- Permit fields: `permit_number`, `valid_from`, `annual_quota`
- Equipment fields: `serial_number`, `item_condition`, `maintenance_interval_days`

---

## Quick Start Examples

### Adding a New Consumable Product

```
POST /api/inventory
{
  "name": "Bottled Water 500ml",
  "sku": "BW-500",
  "inventory_category": "physical_stock",
  "stock_type": "consumable",
  "unit_of_measure": "bottle",
  "sale_price": 2.00,
  "cost_price": 0.75,
  "reorder_point": 100,
  "reorder_quantity": 500
}
```

### Adding a New Tour Product

```
POST /api/inventory
{
  "name": "Desert Safari Adventure",
  "sku": "TOUR-DSA",
  "inventory_category": "tour_product",
  "sale_price": 150.00,
  "duration_hours": 6,
  "max_participants": 10,
  "min_participants": 2,
  "difficulty_level": "moderate",
  "included_items": ["Lunch", "Water", "Hotel pickup"],
  "required_equipment": ["Sunglasses", "Comfortable shoes"]
}
```

### Recording a Stock Transfer

```
POST /api/inventory/transfers
{
  "source_location_id": "warehouse-uuid",
  "destination_location_id": "office-uuid",
  "expected_date": "2025-12-20",
  "notes": "Restocking downtown office",
  "items": [
    { "product_id": "water-uuid", "quantity": 50 },
    { "product_id": "snacks-uuid", "quantity": 30 }
  ]
}
```

---

## Troubleshooting

### Common Issues

**Q: Why didn't inventory decrease when I created an invoice?**
A: Inventory only decreases when the invoice status changes from `draft` to `sent` or `paid`. Draft invoices don't affect stock.

**Q: Why is my product not appearing in the Physical Stock tab?**
A: Check that the product's `inventory_category` is set to `physical_stock`.

**Q: How do I see inventory at a specific location?**
A: Use the location filter in the inventory list, or call `GET /api/inventory/locations/[id]/stock`.

**Q: My permit quota isn't updating automatically.**
A: Quota updates happen through permit allocations. Create allocations when using permit quota.

---

## Security Notes

All new tables have Row Level Security (RLS) enabled:
- Users can only access their own organization's data
- Roles determine permissions (admin, accountant, manager, sales)
- All operations are logged for audit purposes

---

*Document last updated: December 18, 2025*

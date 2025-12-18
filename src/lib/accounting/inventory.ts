// =====================================================
// Inventory Management Logic
// Sceneside L.L.C Financial System
// Integrated with Invoicing and Journal Entries
// =====================================================

import { supabase as defaultSupabase } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createJournalEntry, postJournalEntry } from './general-ledger';
import Decimal from 'decimal.js';

// Default account codes
const DEFAULT_INVENTORY_ACCOUNT_CODE = '1300'; // Inventory Asset
const DEFAULT_COGS_ACCOUNT_CODE = '5100'; // Cost of Goods Sold
const DEFAULT_INVENTORY_ADJUSTMENT_ACCOUNT_CODE = '5900'; // Inventory Adjustments

export interface InventoryConsumptionResult {
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
  costLayers: {
    layerId: string;
    quantityUsed: number;
    unitCost: number;
    totalCost: number;
  }[];
}

export interface InventoryConsumptionSummary {
  consumptions: InventoryConsumptionResult[];
  totalCost: number;
  journalEntryId?: string;
}

/**
 * Checks if a product is inventory-tracked (physical stock)
 */
export async function isInventoryTracked(
  productId: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<boolean> {
  const { data: product, error } = await supabase
    .from('products')
    .select('inventory_category, stock_type, is_active, track_inventory')
    .eq('id', productId)
    .single();

  if (error || !product) {
    return false;
  }

  // Product must be active and either explicitly tracked or a physical stock item
  const isPhysicalStock = product.inventory_category === 'physical_stock';
  const isTracked = product.track_inventory === true;

  return isPhysicalStock || isTracked;
}

/**
 * Gets the inventory category for a product
 */
export async function getProductInventoryType(
  productId: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<{
  category: string | null;
  stockType: string | null;
  trackInventory: boolean;
}> {
  const { data: products, error } = await supabase
    .from('products')
    .select('inventory_category, stock_type, track_inventory')
    .eq('id', productId)
    .limit(1);

  const product = products?.[0] || null;

  if (error || !product) {
    return { category: null, stockType: null, trackInventory: false };
  }

  return {
    category: product.inventory_category,
    stockType: product.stock_type,
    trackInventory: product.track_inventory ?? false,
  };
}

/**
 * Consume inventory for a specific product using the database function
 * Uses FIFO costing by default
 */
export async function consumeInventory(
  productId: string,
  quantity: number,
  locationId?: string,
  referenceType?: string,
  referenceId?: string,
  notes?: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<InventoryConsumptionResult | null> {
  // First check if this product is inventory tracked
  const tracked = await isInventoryTracked(productId, supabase);
  if (!tracked) return null;

  // Get product name for the result
  const { data: product } = await supabase
    .from('products')
    .select('name, valuation_method')
    .eq('id', productId)
    .single();

  if (!product) return null;

  // Get default location if not specified
  let effectiveLocationId = locationId;
  if (!effectiveLocationId) {
    const { data: defaultLocation } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('is_default', true)
      .single();
    effectiveLocationId = defaultLocation?.id;
  }

  // Call the database function to consume inventory using the appropriate method
  const valuationMethod = product.valuation_method || 'fifo';
  
  // Get cost layers to consume from
  const { data: layers, error: layersError } = await supabase
    .from('inventory_cost_layers')
    .select('*')
    .eq('product_id', productId)
    .gt('remaining_quantity', 0)
    .order('received_date', { ascending: valuationMethod === 'fifo' ? true : false });

  if (layersError || !layers || layers.length === 0) {
    console.warn(`⚠️ No cost layers found for product ${productId}. Allowing zero-cost inventory consumption.`);
    
    // Allow consumption without cost layers (quantity deduction only, no COGS)
    // Create transaction record
    await supabase.from('inventory_transactions').insert({
      product_id: productId,
      location_id: effectiveLocationId,
      transaction_type: 'sale',
      quantity: -quantity,
      unit_cost: 0,
      total_cost: 0,
      reference_type: referenceType,
      reference_id: referenceId,
      notes: notes || `Consumed for ${referenceType} ${referenceId} (no cost layers available)`,
    });

    // Update product quantity_on_hand
    const { data: currentProduct } = await supabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', productId)
      .single();

    if (currentProduct && currentProduct.quantity_on_hand >= quantity) {
      await supabase
        .from('products')
        .update({
          quantity_on_hand: currentProduct.quantity_on_hand - quantity
        })
        .eq('id', productId);
    }

    return {
      productId,
      productName: product?.name || 'Unknown',
      quantity,
      totalCost: 0,
      costLayers: [],
    };
  }

  // Calculate cost using FIFO/LIFO
  let remainingToConsume = quantity;
  const consumedLayers: InventoryConsumptionResult['costLayers'] = [];
  let totalCost = new Decimal(0);

  for (const layer of layers) {
    if (remainingToConsume <= 0) break;

    const availableQty = layer.remaining_quantity;
    const qtyToUse = Math.min(availableQty, remainingToConsume);
    const layerCost = new Decimal(qtyToUse).times(layer.unit_cost);

    consumedLayers.push({
      layerId: layer.id,
      quantityUsed: qtyToUse,
      unitCost: layer.unit_cost,
      totalCost: layerCost.toNumber(),
    });

    totalCost = totalCost.plus(layerCost);
    remainingToConsume -= qtyToUse;
  }

  if (remainingToConsume > 0) {
    console.warn(`Insufficient inventory for product ${productId}. Short by ${remainingToConsume} units.`);
    // Continue with available inventory - this allows partial fulfillment
  }

  // Update the cost layers in the database
  for (const consumed of consumedLayers) {
    // Fetch current layer and update manually
    const { data: currentLayer } = await supabase
      .from('inventory_cost_layers')
      .select('remaining_quantity')
      .eq('id', consumed.layerId)
      .single();

    if (currentLayer) {
      await supabase
        .from('inventory_cost_layers')
        .update({
          remaining_quantity: Math.max(0, currentLayer.remaining_quantity - consumed.quantityUsed)
        })
        .eq('id', consumed.layerId);
    }
  }

  // Create inventory transaction record
  await supabase.from('inventory_transactions').insert({
    product_id: productId,
    location_id: effectiveLocationId,
    transaction_type: 'sale',
    quantity: -quantity,
    unit_cost: totalCost.div(quantity - remainingToConsume || 1).toNumber(),
    total_cost: totalCost.toNumber(),
    reference_type: referenceType,
    reference_id: referenceId,
    notes: notes || `Consumed for ${referenceType} ${referenceId}`,
  });

  // Update product quantity_on_hand
  const { data: currentProduct } = await supabase
    .from('products')
    .select('quantity_on_hand')
    .eq('id', productId)
    .single();

  if (currentProduct) {
    await supabase
      .from('products')
      .update({
        quantity_on_hand: Math.max(0, (currentProduct.quantity_on_hand || 0) - (quantity - remainingToConsume))
      })
      .eq('id', productId);
  }

  // Update location stock if applicable
  if (effectiveLocationId) {
    const { data: locationStock } = await supabase
      .from('product_stock_locations')
      .select('quantity_on_hand')
      .eq('product_id', productId)
      .eq('location_id', effectiveLocationId)
      .single();

    if (locationStock) {
      await supabase
        .from('product_stock_locations')
        .update({
          quantity_on_hand: Math.max(0, locationStock.quantity_on_hand - (quantity - remainingToConsume))
        })
        .eq('product_id', productId)
        .eq('location_id', effectiveLocationId);
    }
  }

  return {
    productId,
    productName: product.name,
    quantity: quantity - remainingToConsume,
    totalCost: totalCost.toNumber(),
    costLayers: consumedLayers,
  };
}

/**
 * Consume inventory for multiple products (e.g., from invoice lines)
 */
export async function consumeInventoryBatch(
  items: {
    productId: string;
    quantity: number;
    locationId?: string;
  }[],
  referenceType: string,
  referenceId: string,
  notes?: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<InventoryConsumptionSummary> {
  const consumptions: InventoryConsumptionResult[] = [];
  let totalCost = new Decimal(0);

  for (const item of items) {
    const result = await consumeInventory(
      item.productId,
      item.quantity,
      item.locationId,
      referenceType,
      referenceId,
      notes,
      supabase
    );

    if (result) {
      consumptions.push(result);
      totalCost = totalCost.plus(result.totalCost);
    }
  }

  return {
    consumptions,
    totalCost: totalCost.toNumber(),
  };
}

/**
 * Reverse inventory consumption (e.g., when voiding an invoice)
 */
export async function reverseInventoryConsumption(
  referenceType: string,
  referenceId: string,
  userId: string
): Promise<{ reversed: boolean; journalEntryId?: string }> {
  // Find original transactions
  const { data: transactions, error } = await defaultSupabase
    .from('inventory_transactions')
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .eq('transaction_type', 'sale');

  if (error || !transactions || transactions.length === 0) {
    return { reversed: false };
  }

  let totalCostReversed = new Decimal(0);

  // Reverse each transaction
  for (const transaction of transactions) {
    const reversalQuantity = Math.abs(transaction.quantity);
    const unitCost = transaction.unit_cost;
    const totalCost = Math.abs(transaction.total_cost);

    // Create a new cost layer for the returned inventory
    await defaultSupabase.from('inventory_cost_layers').insert({
      product_id: transaction.product_id,
      location_id: transaction.location_id,
      received_date: new Date().toISOString().split('T')[0],
      quantity_received: reversalQuantity,
      remaining_quantity: reversalQuantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      reference_type: 'reversal',
      reference_id: referenceId,
    });

    // Create reversal transaction
    await defaultSupabase.from('inventory_transactions').insert({
      product_id: transaction.product_id,
      location_id: transaction.location_id,
      transaction_type: 'return',
      quantity: reversalQuantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      reference_type: `${referenceType}_reversal`,
      reference_id: referenceId,
      notes: `Reversal of ${referenceType} ${referenceId}`,
    });

    // Update product quantity
    const { data: product } = await defaultSupabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', transaction.product_id)
      .single();

    if (product) {
      await defaultSupabase
        .from('products')
        .update({
          quantity_on_hand: (product.quantity_on_hand || 0) + reversalQuantity
        })
        .eq('id', transaction.product_id);
    }

    // Update location stock
    if (transaction.location_id) {
      const { data: locationStock } = await defaultSupabase
        .from('product_stock_locations')
        .select('quantity_on_hand')
        .eq('product_id', transaction.product_id)
        .eq('location_id', transaction.location_id)
        .single();

      if (locationStock) {
        await defaultSupabase
          .from('product_stock_locations')
          .update({
            quantity_on_hand: locationStock.quantity_on_hand + reversalQuantity
          })
          .eq('product_id', transaction.product_id)
          .eq('location_id', transaction.location_id);
      }
    }

    totalCostReversed = totalCostReversed.plus(totalCost);
  }

  // Create reversal journal entry if there was cost involved
  let journalEntryId: string | undefined;
  if (totalCostReversed.greaterThan(0)) {
    journalEntryId = await createCOGSReversalJournalEntry(
      totalCostReversed.toNumber(),
      referenceType,
      referenceId,
      userId
    );
  }

  return { reversed: true, journalEntryId };
}

/**
 * Creates a COGS journal entry for inventory consumption
 * DR Cost of Goods Sold, CR Inventory
 */
export async function createCOGSJournalEntry(
  totalCost: number,
  referenceType: string,
  referenceId: string,
  userId: string,
  description?: string
): Promise<string | undefined> {
  if (totalCost <= 0) return undefined;

  // Get account IDs
  const { data: inventoryAccount } = await defaultSupabase
    .from('accounts')
    .select('id')
    .eq('code', DEFAULT_INVENTORY_ACCOUNT_CODE)
    .single();

  const { data: cogsAccount } = await defaultSupabase
    .from('accounts')
    .select('id')
    .eq('code', DEFAULT_COGS_ACCOUNT_CODE)
    .single();

  if (!inventoryAccount || !cogsAccount) {
    console.error('Required accounts not found for COGS journal entry');
    return undefined;
  }

  try {
    const entry = await createJournalEntry(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: description || `COGS for ${referenceType} ${referenceId}`,
        memo: referenceId,
        source_module: 'inventory',
        source_document_id: referenceId,
        lines: [
          {
            account_id: cogsAccount.id,
            description: `Cost of goods sold - ${referenceType}`,
            debit: totalCost,
            credit: 0,
          },
          {
            account_id: inventoryAccount.id,
            description: `Inventory reduction - ${referenceType}`,
            debit: 0,
            credit: totalCost,
          },
        ],
      },
      userId
    );

    return entry.id;
  } catch (error) {
    console.error('Failed to create COGS journal entry:', error);
    return undefined;
  }
}

/**
 * Creates a COGS reversal journal entry
 * DR Inventory, CR Cost of Goods Sold
 */
async function createCOGSReversalJournalEntry(
  totalCost: number,
  referenceType: string,
  referenceId: string,
  userId: string
): Promise<string | undefined> {
  if (totalCost <= 0) return undefined;

  // Get account IDs
  const { data: inventoryAccount } = await defaultSupabase
    .from('accounts')
    .select('id')
    .eq('code', DEFAULT_INVENTORY_ACCOUNT_CODE)
    .single();

  const { data: cogsAccount } = await defaultSupabase
    .from('accounts')
    .select('id')
    .eq('code', DEFAULT_COGS_ACCOUNT_CODE)
    .single();

  if (!inventoryAccount || !cogsAccount) {
    console.error('Required accounts not found for COGS reversal journal entry');
    return undefined;
  }

  try {
    const entry = await createJournalEntry(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: `COGS Reversal for voided ${referenceType} ${referenceId}`,
        memo: referenceId,
        source_module: 'inventory_reversal',
        source_document_id: referenceId,
        lines: [
          {
            account_id: inventoryAccount.id,
            description: `Inventory restoration - ${referenceType} reversal`,
            debit: totalCost,
            credit: 0,
          },
          {
            account_id: cogsAccount.id,
            description: `COGS reversal - ${referenceType}`,
            debit: 0,
            credit: totalCost,
          },
        ],
      },
      userId
    );

    return entry.id;
  } catch (error) {
    console.error('Failed to create COGS reversal journal entry:', error);
    return undefined;
  }
}

/**
 * Create a tour booking from an invoice line
 */
export async function createTourBooking(
  tourProductId: string,
  invoiceId: string,
  customerId: string,
  tourDate: string,
  participants: number,
  notes?: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  // Find an available tour schedule
  const { data: schedules, error: scheduleError } = await defaultSupabase
    .from('tour_schedules')
    .select('*')
    .eq('product_id', tourProductId)
    .eq('schedule_date', tourDate)
    .eq('status', 'scheduled')
    .gte('available_capacity', participants);

  if (scheduleError) {
    return { success: false, error: `Failed to find tour schedules: ${scheduleError.message}` };
  }

  if (!schedules || schedules.length === 0) {
    // Create a new schedule if none exists
    const { data: product } = await defaultSupabase
      .from('products')
      .select('max_participants, duration_hours')
      .eq('id', tourProductId)
      .single();

    if (!product) {
      return { success: false, error: 'Tour product not found' };
    }

    const { data: newSchedule, error: createError } = await defaultSupabase
      .from('tour_schedules')
      .insert({
        product_id: tourProductId,
        schedule_date: tourDate,
        start_time: '09:00',
        end_time: `${9 + (product.duration_hours || 2)}:00`,
        max_capacity: product.max_participants || 10,
        booked_capacity: 0,
        available_capacity: product.max_participants || 10,
        status: 'scheduled',
      })
      .select()
      .single();

    if (createError) {
      return { success: false, error: `Failed to create tour schedule: ${createError.message}` };
    }

    schedules.push(newSchedule);
  }

  const schedule = schedules[0];

  // Create the booking
  const { data: booking, error: bookingError } = await defaultSupabase
    .from('tour_bookings')
    .insert({
      tour_schedule_id: schedule.id,
      customer_id: customerId,
      invoice_id: invoiceId,
      number_of_participants: participants,
      booking_status: 'confirmed',
      payment_status: 'pending',
      notes,
    })
    .select()
    .single();

  if (bookingError) {
    return { success: false, error: `Failed to create booking: ${bookingError.message}` };
  }

  // Update schedule capacity
  await defaultSupabase
    .from('tour_schedules')
    .update({
      booked_capacity: schedule.booked_capacity + participants,
      available_capacity: schedule.available_capacity - participants,
    })
    .eq('id', schedule.id);

  return { success: true, bookingId: booking.id };
}

/**
 * Process inventory for an invoice
 * This is the main function called when an invoice is posted
 */
export async function processInvoiceInventory(
  invoiceId: string,
  invoiceLines: {
    product_id: string | null;
    quantity: number;
    description?: string;
  }[],
  customerId: string,
  userId: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<InventoryConsumptionSummary> {
  const itemsToConsume: { productId: string; quantity: number }[] = [];
  const tourBookings: { productId: string; quantity: number }[] = [];

  // Separate inventory items from tour products
  for (const line of invoiceLines) {
    if (!line.product_id) continue;

    const productType = await getProductInventoryType(line.product_id, supabase);

    if (productType.category === 'physical_stock' || productType.trackInventory) {
      itemsToConsume.push({
        productId: line.product_id,
        quantity: line.quantity,
      });
    } else if (productType.category === 'tour_product') {
      tourBookings.push({
        productId: line.product_id,
        quantity: line.quantity,
      });
    }
  }

  // Consume physical inventory
  const consumptionResult = await consumeInventoryBatch(
    itemsToConsume,
    'invoice',
    invoiceId,
    undefined,
    supabase
  );

  // Create COGS journal entry
  if (consumptionResult.totalCost > 0) {
    consumptionResult.journalEntryId = await createCOGSJournalEntry(
      consumptionResult.totalCost,
      'invoice',
      invoiceId,
      userId
    );
  }

  // Process tour bookings (capacity-based, not physical inventory)
  for (const booking of tourBookings) {
    // Tour bookings are typically created separately with specific dates
    // This logs the intent for follow-up
      await defaultSupabase.from('inventory_transactions').insert({
      product_id: booking.productId,
      transaction_type: 'sale',
      quantity: -booking.quantity,
      unit_cost: 0,
      total_cost: 0,
      reference_type: 'invoice',
      reference_id: invoiceId,
      notes: `Tour booking pending schedule assignment - ${booking.quantity} participants`,
    });
  }

  return consumptionResult;
}

/**
 * Reverse inventory for a voided invoice
 */
export async function reverseInvoiceInventory(
  invoiceId: string,
  userId: string
): Promise<{ success: boolean; journalEntryId?: string }> {
  const result = await reverseInventoryConsumption('invoice', invoiceId, userId);

  // Also reverse any tour bookings
  const { data: bookings } = await defaultSupabase
    .from('tour_bookings')
    .select('*, tour_schedules(*)')
    .eq('invoice_id', invoiceId);

  if (bookings && bookings.length > 0) {
    for (const booking of bookings) {
      // Update booking status
      await defaultSupabase
        .from('tour_bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking.id);

      // Restore capacity
      if (booking.tour_schedules) {
        await defaultSupabase
          .from('tour_schedules')
          .update({
            booked_capacity: Math.max(0, booking.tour_schedules.booked_capacity - booking.number_of_participants),
            available_capacity: booking.tour_schedules.available_capacity + booking.number_of_participants,
          })
          .eq('id', booking.tour_schedule_id);
      }
    }
  }

  return { success: result.reversed, journalEntryId: result.journalEntryId };
}

/**
 * Get inventory valuation summary
 */
export async function getInventoryValuation(
  method: 'fifo' | 'lifo' | 'weighted_average' = 'fifo',
  asOfDate?: string
): Promise<{
  products: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    totalCost: number;
    averageCost: number;
  }[];
  totalValue: number;
}> {
  const effectiveDate = asOfDate || new Date().toISOString().split('T')[0];

  // Get all inventory-tracked products
  const { data: products, error } = await defaultSupabase
    .from('products')
    .select('id, name, sku, quantity_on_hand')
    .or('inventory_category.eq.physical_stock,track_inventory.eq.true')
    .gt('quantity_on_hand', 0);

  if (error || !products) {
    return { products: [], totalValue: 0 };
  }

  const valuations: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    totalCost: number;
    averageCost: number;
  }[] = [];

  let totalValue = new Decimal(0);

  for (const product of products) {
    // Get cost layers for this product
    const { data: layers } = await defaultSupabase
      .from('inventory_cost_layers')
      .select('*')
      .eq('product_id', product.id)
      .gt('remaining_quantity', 0)
      .lte('received_date', effectiveDate)
      .order('received_date', { ascending: method === 'fifo' });

    if (!layers || layers.length === 0) continue;

    let productTotal = new Decimal(0);
    let productQuantity = 0;

    for (const layer of layers) {
      productTotal = productTotal.plus(new Decimal(layer.remaining_quantity).times(layer.unit_cost));
      productQuantity += layer.remaining_quantity;
    }

    valuations.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      quantity: productQuantity,
      totalCost: productTotal.toNumber(),
      averageCost: productQuantity > 0 ? productTotal.div(productQuantity).toNumber() : 0,
    });

    totalValue = totalValue.plus(productTotal);
  }

  return {
    products: valuations,
    totalValue: totalValue.toNumber(),
  };
}

/**
 * Process inventory for a bill (receiving inventory from purchase)
 * This is called when a bill is approved/posted
 */
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
  const itemsReceived: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    costLayerId: string;
  }[] = [];
  let totalCost = new Decimal(0);

  // Get default location if needed
  const { data: defaultLocation } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_default', true)
    .single();

  const locationId = defaultLocation?.id;

  // Process each line that has a product
  for (const line of billLines) {
    if (!line.product_id) {
      console.log('⏭️ Skipping line without product_id');
      continue;
    }

    console.log(`🔍 Processing product ${line.product_id}, qty: ${line.quantity}, cost: ${line.unit_cost}`);

    // Check if product is inventory tracked
    const tracked = await isInventoryTracked(line.product_id, supabase);
    console.log(`📊 Product ${line.product_id} tracked:`, tracked);
    if (!tracked) {
      console.log(`⏭️ Skipping non-tracked product ${line.product_id}`);
      continue;
    }

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('name, inventory_category')
      .eq('id', line.product_id)
      .single();

    if (!product) {
      console.log(`❌ Product ${line.product_id} not found`);
      continue;
    }
    console.log(`✅ Product found: ${product.name}, category: ${product.inventory_category}`);

    const lineCost = new Decimal(line.quantity).times(line.unit_cost);

    // Create cost layer for this purchase
    const { data: costLayer, error: layerError } = await supabase
      .from('inventory_cost_layers')
      .insert({
        product_id: line.product_id,
        location_id: locationId,
        transaction_type: 'purchase',
        transaction_id: billId,
        transaction_date: billDate,
        quantity_received: line.quantity,
        quantity_remaining: line.quantity,
        unit_cost: line.unit_cost,
        currency: 'USD',
        exchange_rate: 1.000000,
      })
      .select()
      .single();

    if (layerError) {
      console.error(`Failed to create cost layer for product ${line.product_id}:`, layerError);
      continue;
    }

    // Update product quantity_on_hand
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

    // Create inventory transaction record
    await supabase.from('inventory_transactions').insert({
      product_id: line.product_id,
      location_id: locationId,
      transaction_type: 'purchase',
      quantity: line.quantity,
      unit_cost: line.unit_cost,
      total_cost: lineCost.toNumber(),
      reference_type: 'bill',
      reference_id: billId,
      notes: `Received from bill ${billId} - ${line.description || ''}`,
    });

    // Update location stock if applicable
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
        // Create location stock record if doesn't exist
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

  // Create journal entry for inventory receipt (DR Inventory Asset, CR AP handled by bill posting)
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

/**
 * Creates an inventory receipt journal entry for bill
 * Note: This is informational - the main DR/CR is in bill posting
 */
async function createInventoryReceiptJournalEntry(
  totalCost: number,
  billId: string,
  userId: string
): Promise<string | undefined> {
  if (totalCost <= 0) return undefined;

  // This creates a memo entry for inventory tracking
  // The actual AP entry is created when the bill is posted
  // This is just to track inventory value increase

  try {
    const entry = await createJournalEntry(
      {
        entry_date: new Date().toISOString().split('T')[0],
        description: `Inventory receipt from bill ${billId}`,
        memo: billId,
        source_module: 'inventory',
        source_document_id: billId,
        lines: [
          {
            account_id: (await defaultSupabase
              .from('accounts')
              .select('id')
              .eq('code', DEFAULT_INVENTORY_ACCOUNT_CODE)
              .single()).data?.id || '',
            description: 'Inventory received from purchase',
            debit: totalCost,
            credit: 0,
          },
          {
            account_id: (await defaultSupabase
              .from('accounts')
              .select('id')
              .eq('code', '2000') // AP Account
              .single()).data?.id || '',
            description: 'Purchase on account',
            debit: 0,
            credit: totalCost,
          },
        ],
      },
      userId
    );

    return entry.id;
  } catch (error) {
    console.error('Failed to create inventory receipt journal entry:', error);
    return undefined;
  }
}

/**
 * Reverse inventory receipt when a bill is voided
 */
export async function reverseBillInventory(
  billId: string,
  userId: string
): Promise<{ reversed: boolean; journalEntryId?: string }> {
  // Find original transactions
  const { data: transactions, error } = await defaultSupabase
    .from('inventory_transactions')
    .select('*')
    .eq('reference_type', 'bill')
    .eq('reference_id', billId)
    .eq('transaction_type', 'purchase');

  if (error || !transactions || transactions.length === 0) {
    return { reversed: false };
  }

  let totalCostReversed = new Decimal(0);

  // Reverse each transaction
  for (const transaction of transactions) {
    // Remove cost layer or reduce its quantity
    const { data: costLayer } = await defaultSupabase
      .from('inventory_cost_layers')
      .select('*')
      .eq('product_id', transaction.product_id)
      .eq('reference_type', 'bill')
      .eq('reference_id', billId)
      .single();

    if (costLayer) {
      // Check if any quantity has been consumed
      if (costLayer.remaining_quantity === costLayer.quantity_received) {
        // Not used yet, can delete the cost layer
        await defaultSupabase
          .from('inventory_cost_layers')
          .delete()
          .eq('id', costLayer.id);
      } else if (costLayer.remaining_quantity > 0) {
        // Partially consumed, adjust the layer
        await defaultSupabase
          .from('inventory_cost_layers')
          .update({
            quantity_received: costLayer.remaining_quantity,
          })
          .eq('id', costLayer.id);
      }
      // If remaining_quantity is 0, the layer is fully consumed, leave it for history
    }

    // Create reversal transaction
    await defaultSupabase.from('inventory_transactions').insert({
      product_id: transaction.product_id,
      location_id: transaction.location_id,
      transaction_type: 'adjustment',
      quantity: -transaction.quantity,
      unit_cost: transaction.unit_cost,
      total_cost: -transaction.total_cost,
      reference_type: 'bill_void',
      reference_id: billId,
      notes: `Reversal of voided bill ${billId}`,
    });

    // Update product quantity
    const { data: product } = await defaultSupabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', transaction.product_id)
      .single();

    if (product) {
      await defaultSupabase
        .from('products')
        .update({
          quantity_on_hand: Math.max(0, (product.quantity_on_hand || 0) - transaction.quantity),
        })
        .eq('id', transaction.product_id);
    }

    // Update location stock
    if (transaction.location_id) {
      const { data: locationStock } = await defaultSupabase
        .from('product_stock_locations')
        .select('quantity_on_hand')
        .eq('product_id', transaction.product_id)
        .eq('location_id', transaction.location_id)
        .single();

      if (locationStock) {
        await defaultSupabase
          .from('product_stock_locations')
          .update({
            quantity_on_hand: Math.max(0, locationStock.quantity_on_hand - transaction.quantity),
          })
          .eq('product_id', transaction.product_id)
          .eq('location_id', transaction.location_id);
      }
    }

    totalCostReversed = totalCostReversed.plus(Math.abs(transaction.total_cost));
  }

  // Create reversal journal entry if there was cost involved
  let journalEntryId: string | undefined;
  if (totalCostReversed.greaterThan(0)) {
    try {
      const entry = await createJournalEntry(
        {
          entry_date: new Date().toISOString().split('T')[0],
          description: `Inventory receipt reversal for voided bill ${billId}`,
          memo: billId,
          source_module: 'inventory_reversal',
          source_document_id: billId,
          lines: [
            {
              account_id: (await defaultSupabase
                .from('accounts')
                .select('id')
                .eq('code', '2000') // AP Account
                .single()).data?.id || '',
              description: 'Reversal of purchase on account',
              debit: totalCostReversed.toNumber(),
              credit: 0,
            },
            {
              account_id: (await defaultSupabase
                .from('accounts')
                .select('id')
                .eq('code', DEFAULT_INVENTORY_ACCOUNT_CODE)
                .single()).data?.id || '',
              description: 'Inventory receipt reversal',
              debit: 0,
              credit: totalCostReversed.toNumber(),
            },
          ],
        },
        userId
      );
      journalEntryId = entry.id;
    } catch (error) {
      console.error('Failed to create inventory reversal journal entry:', error);
    }
  }

  return { reversed: true, journalEntryId };
}




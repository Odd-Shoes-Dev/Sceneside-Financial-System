import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all products with inventory tracking
    const { data: allItems, error } = await supabase
      .from('products')
      .select('quantity_on_hand, cost_price, currency, reorder_point, inventory_category, stock_type, item_condition, permit_status, permit_expiry_date, next_maintenance_date, track_inventory, is_active')
      .eq('is_active', true);

    if (error) throw error;

    if (!allItems) {
      return NextResponse.json({
        totalItems: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
        byCategory: {},
        permits: {},
        equipment: {},
      });
    }

    // Filter trackable items for value calculation
    const trackableItems = allItems.filter(item => item.track_inventory);
    const totalItems = trackableItems.length;
    let totalValue = 0;

    // Convert each item's value to USD
    for (const item of trackableItems) {
      const quantity = item.quantity_on_hand || 0;
      const cost = item.cost_price || 0;
      const itemValue = quantity * cost;

      if (itemValue > 0) {
        let valueInUSD = itemValue;

        // Convert to USD if not already
        if (item.currency && item.currency !== 'USD') {
          const { data: converted, error: conversionError } = await supabase.rpc('convert_currency', {
            p_amount: itemValue,
            p_from_currency: item.currency,
            p_to_currency: 'USD',
            p_date: new Date().toISOString().split('T')[0],
          });

          if (conversionError) {
            console.error('Currency conversion error:', conversionError);
            valueInUSD = itemValue; // Fallback
          } else {
            valueInUSD = converted || itemValue;
          }
        }

        totalValue += valueInUSD;
      }
    }

    const lowStock = trackableItems.filter(
      item => (item.quantity_on_hand || 0) <= (item.reorder_point || 0) && (item.quantity_on_hand || 0) > 0
    ).length;
    
    const outOfStock = trackableItems.filter(item => (item.quantity_on_hand || 0) === 0).length;

    // Group by inventory category
    const byCategory = {
      physical_stock: allItems.filter(i => i.inventory_category === 'physical_stock' || !i.inventory_category).length,
      tour_product: allItems.filter(i => i.inventory_category === 'tour_product').length,
      permit: allItems.filter(i => i.inventory_category === 'permit').length,
    };

    // Group by stock type
    const byStockType = {
      consumable: allItems.filter(i => i.stock_type === 'consumable' || !i.stock_type).length,
      reusable: allItems.filter(i => i.stock_type === 'reusable').length,
      merchandise: allItems.filter(i => i.stock_type === 'merchandise').length,
      spare_part: allItems.filter(i => i.stock_type === 'spare_part').length,
    };

    // Permit statistics
    const permitItems = allItems.filter(i => i.inventory_category === 'permit');
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const permits = {
      total: permitItems.length,
      active: permitItems.filter(p => p.permit_status === 'active').length,
      expired: permitItems.filter(p => p.permit_status === 'expired').length,
      pending_renewal: permitItems.filter(p => p.permit_status === 'pending_renewal').length,
      expiring_soon: permitItems.filter(p => {
        if (!p.permit_expiry_date) return false;
        const expiry = new Date(p.permit_expiry_date);
        return expiry >= today && expiry <= thirtyDaysFromNow;
      }).length,
    };

    // Equipment statistics
    const equipmentItems = allItems.filter(i => i.stock_type === 'reusable');
    const equipment = {
      total: equipmentItems.length,
      good_condition: equipmentItems.filter(e => e.item_condition === 'good' || e.item_condition === 'new').length,
      fair_condition: equipmentItems.filter(e => e.item_condition === 'fair').length,
      poor_condition: equipmentItems.filter(e => e.item_condition === 'poor' || e.item_condition === 'damaged').length,
      maintenance_due: equipmentItems.filter(e => {
        if (!e.next_maintenance_date) return false;
        return new Date(e.next_maintenance_date) <= today;
      }).length,
    };

    return NextResponse.json({
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      byCategory,
      byStockType,
      permits,
      equipment,
    });
  } catch (error) {
    console.error('Error calculating inventory stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate inventory stats' },
      { status: 500 }
    );
  }
}

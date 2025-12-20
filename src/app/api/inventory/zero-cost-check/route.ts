import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all active products that track inventory
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, quantity_on_hand, track_inventory, inventory_category')
      .eq('is_active', true);

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return NextResponse.json({
        zeroCostProducts: [],
        count: 0,
      });
    }

    // Filter to inventory-tracked products
    const trackedProducts = products.filter(p => 
      p.track_inventory || p.inventory_category === 'physical_stock'
    );

    // Check each product for cost layers
    const zeroCostProducts: Array<{
      id: string;
      name: string;
      sku: string | null;
      quantityOnHand: number;
      hasCostLayers: boolean;
    }> = [];

    for (const product of trackedProducts) {
      // Only check products with quantity on hand
      if ((product.quantity_on_hand || 0) > 0) {
        const { data: costLayers, error: layersError } = await supabase
          .from('inventory_cost_layers')
          .select('quantity_remaining')
          .eq('product_id', product.id)
          .gt('quantity_remaining', 0)
          .limit(1);

        if (layersError) {
          console.error('Error checking cost layers for product:', product.id, layersError);
          continue;
        }

        // If product has quantity but no cost layers
        if (!costLayers || costLayers.length === 0) {
          zeroCostProducts.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            quantityOnHand: product.quantity_on_hand || 0,
            hasCostLayers: false,
          });
        }
      }
    }

    return NextResponse.json({
      zeroCostProducts,
      count: zeroCostProducts.length,
    });

  } catch (error: any) {
    console.error('Error checking zero-cost products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

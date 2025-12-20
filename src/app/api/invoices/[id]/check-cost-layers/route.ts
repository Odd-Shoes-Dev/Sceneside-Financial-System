import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/invoices/[id]/check-cost-layers
// Check if invoice has products without cost layers
export async function GET(request: NextRequest, context: any) {
  const { params } = context || {};
  const resolvedParams = await params;
  
  try {
    const supabase = await createClient();

    // Get invoice lines with product details
    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select(`
        product_id,
        quantity,
        description,
        products (
          id,
          name,
          sku,
          track_inventory,
          inventory_category
        )
      `)
      .eq('invoice_id', resolvedParams.id);

    if (linesError) {
      return NextResponse.json({ error: 'Failed to fetch invoice lines' }, { status: 500 });
    }

    if (!lines || lines.length === 0) {
      return NextResponse.json({ 
        hasZeroCostProducts: false,
        zeroCostProducts: [] 
      });
    }

    // Check each line item for cost layers
    const zeroCostProducts: Array<{
      productId: string;
      productName: string;
      sku: string | null;
      quantity: number;
      quantityAvailable: number;
    }> = [];

    for (const line of lines) {
      // Skip non-inventory products
      if (!line.product_id || !line.products) continue;
      
      // Handle both array and object response from Supabase
      const product = (line.products as any);
      if (!product) continue;
      
      const isTracked = product.track_inventory || product.inventory_category === 'physical_stock';
      
      if (!isTracked) continue;

      // Check if product has available cost layers
      const { data: costLayers, error: layersError } = await supabase
        .from('inventory_cost_layers')
        .select('quantity_remaining')
        .eq('product_id', line.product_id)
        .gt('quantity_remaining', 0);

      if (layersError) {
        console.error('Error checking cost layers:', layersError);
        continue;
      }

      const totalAvailable = (costLayers || []).reduce(
        (sum, layer) => sum + (layer.quantity_remaining || 0), 
        0
      );

      // If no cost layers or insufficient quantity
      if (totalAvailable === 0) {
        zeroCostProducts.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: line.quantity,
          quantityAvailable: totalAvailable,
        });
      }
    }

    return NextResponse.json({
      hasZeroCostProducts: zeroCostProducts.length > 0,
      zeroCostProducts,
    });

  } catch (error: any) {
    console.error('Error checking cost layers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

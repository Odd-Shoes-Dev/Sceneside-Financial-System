import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/valuation - Get inventory valuation report
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const method = searchParams.get('method') || 'weighted_average'; // fifo, lifo, weighted_average
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];

    // Get valuation view
    let query = supabase
      .from('v_inventory_valuation')
      .select('*')
      .order('product_name');

    if (location) {
      query = query.eq('location_id', location);
    }

    const { data: valuationData, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Filter by category if specified (product_categories)
    let filteredData = valuationData || [];
    if (category) {
      filteredData = filteredData.filter((item: any) => item.category_id === category);
    }

    // Calculate totals based on valuation method
    let totalValue = 0;
    const valuedItems = [];

    for (const item of filteredData) {
      let itemValue = 0;
      
      switch (method) {
        case 'fifo':
          itemValue = item.fifo_value || 0;
          break;
        case 'lifo':
          itemValue = item.lifo_value || 0;
          break;
        case 'weighted_average':
        default:
          itemValue = item.average_value || 0;
          break;
      }

      totalValue += itemValue;
      valuedItems.push({
        ...item,
        calculated_value: itemValue,
        valuation_method: method,
      });
    }

    // Group by product for summary and categorize by stock type
    const productSummary = valuedItems.reduce((acc: any, item: any) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          stock_type: item.stock_type,
          inventory_category: item.inventory_category,
          total_quantity: 0,
          total_value: 0,
          locations: [],
        };
      }
      acc[item.product_id].total_quantity += item.total_quantity || 0;
      acc[item.product_id].total_value += item.calculated_value;
      if (item.location_id) {
        acc[item.product_id].locations.push({
          location_id: item.location_id,
          location_name: item.location_name,
          quantity: item.total_quantity,
          value: item.calculated_value,
        });
      }
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        total_value: totalValue,
        total_items: Object.keys(productSummary).length,
        valuation_method: method,
        as_of_date: asOfDate,
      },
      by_product: Object.values(productSummary),
      detailed: valuedItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

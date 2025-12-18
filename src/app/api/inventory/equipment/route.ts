import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/equipment - List all equipment (reusable items)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const condition = searchParams.get('condition');
    const maintenanceDue = searchParams.get('maintenance_due') === 'true';
    const available = searchParams.get('available') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get equipment from products table where stock_type = 'reusable'
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('stock_type', 'reusable')
      .order('name');

    if (condition) {
      query = query.eq('item_condition', condition);
    }

    if (maintenanceDue) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('next_maintenance_date', today);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If filtering by availability, we need to check assignments
    let filteredData = data || [];
    if (available) {
      // Get currently assigned equipment
      const { data: assignments } = await supabase
        .from('equipment_assignments')
        .select('product_id')
        .eq('status', 'active');

      const assignedIds = new Set(assignments?.map(a => a.product_id) || []);
      filteredData = filteredData.filter((item: any) => !assignedIds.has(item.id));
    }

    // Get equipment status summary
    const { data: allEquipment } = await supabase
      .from('products')
      .select('item_condition, next_maintenance_date')
      .eq('stock_type', 'reusable');

    const today = new Date();
    const summary = {
      total: allEquipment?.length || 0,
      good: allEquipment?.filter(e => e.item_condition === 'good').length || 0,
      fair: allEquipment?.filter(e => e.item_condition === 'fair').length || 0,
      poor: allEquipment?.filter(e => e.item_condition === 'poor').length || 0,
      maintenance_due: allEquipment?.filter(e => {
        if (!e.next_maintenance_date) return false;
        return new Date(e.next_maintenance_date) <= today;
      }).length || 0,
    };

    return NextResponse.json({
      data: available ? filteredData : data,
      summary,
      pagination: {
        page,
        limit,
        total: available ? filteredData.length : count,
        totalPages: Math.ceil((available ? filteredData.length : count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/equipment - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.name || !body.sku) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', body.sku)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Get default accounts
    const { data: assetAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', '1300')
      .single();

    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: body.sku,
        name: body.name,
        description: body.description || null,
        product_type: 'inventory',
        stock_type: 'reusable',
        inventory_category: body.inventory_category || 'physical_stock',
        unit_of_measure: body.unit_of_measure || 'each',
        cost_price: body.cost_price || 0,
        unit_price: body.unit_price || 0,
        currency: body.currency || 'USD',
        quantity_on_hand: body.quantity_on_hand || 1,
        quantity_reserved: 0,
        reorder_point: body.reorder_point || 1,
        item_condition: body.item_condition || 'good',
        last_maintenance_date: body.last_maintenance_date || null,
        next_maintenance_date: body.next_maintenance_date || null,
        maintenance_interval_days: body.maintenance_interval_days || null,
        is_active: true,
        track_inventory: true,
        inventory_account_id: assetAccount?.id,
        category_id: body.category_id || null,
        image_url: body.image_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

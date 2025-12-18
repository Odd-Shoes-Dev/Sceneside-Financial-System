import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory - List inventory items with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const lowStock = searchParams.get('low_stock');
    const category = searchParams.get('category');
    const inventoryCategory = searchParams.get('inventory_category'); // physical_stock, tour_product, permit
    const stockType = searchParams.get('stock_type'); // consumable, reusable, merchandise, spare_part
    const condition = searchParams.get('condition'); // new, good, fair, poor, damaged
    const location = searchParams.get('location_id');
    const activeOnly = searchParams.get('active') !== 'false';
    const trackInventory = searchParams.get('track_inventory');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*, product_categories(id, name)', { count: 'exact' })
      .order('name');

    // Text search
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Category filter (product_categories)
    if (category) {
      query = query.eq('category_id', category);
    }

    // Inventory category filter (physical_stock, tour_product, permit)
    if (inventoryCategory) {
      query = query.eq('inventory_category', inventoryCategory);
    }

    // Stock type filter (consumable, reusable, merchandise, spare_part)
    if (stockType) {
      query = query.eq('stock_type', stockType);
    }

    // Item condition filter
    if (condition) {
      query = query.eq('item_condition', condition);
    }

    // Active filter
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Track inventory filter
    if (trackInventory === 'true') {
      query = query.eq('track_inventory', true);
    } else if (trackInventory === 'false') {
      query = query.eq('track_inventory', false);
    }

    // Apply pagination unless we need to post-filter for low stock or location
    if (lowStock !== 'true' && !location) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let filteredData = data || [];

    // Filter by location (requires joining with product_stock_locations)
    if (location) {
      const { data: stockAtLocation } = await supabase
        .from('product_stock_locations')
        .select('product_id')
        .eq('location_id', location)
        .gt('quantity_on_hand', 0);

      const productIdsAtLocation = new Set(stockAtLocation?.map(s => s.product_id) || []);
      filteredData = filteredData.filter((item: any) => productIdsAtLocation.has(item.id));
    }

    // When filtering by low stock, compare columns in JS because PostgREST
    // lacks a simple column-to-column comparator.
    if (lowStock === 'true') {
      filteredData = filteredData.filter(
        (item: any) => (item?.quantity_on_hand ?? 0) <= (item?.reorder_point ?? 0)
      );
    }

    // Apply pagination for post-filtered data
    const needsPostPagination = lowStock === 'true' || location;
    const paginatedData = needsPostPagination 
      ? filteredData.slice(offset, offset + limit)
      : filteredData;

    const totalCount = needsPostPagination ? filteredData.length : count;

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory - Create inventory item with full field support
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
        { error: 'An item with this SKU already exists' },
        { status: 400 }
      );
    }

    // Get inventory asset account
    const { data: inventoryAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', '1300')
      .single();

    // Get COGS account
    const { data: cogsAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', '5100')
      .single();

    // Build insert data based on inventory category
    const insertData: any = {
      // Basic fields
      sku: body.sku,
      name: body.name,
      description: body.description || null,
      category_id: body.category_id || null,
      product_type: body.product_type || 'inventory',
      unit_of_measure: body.unit_of_measure || 'each',
      cost_price: body.cost_price || body.unit_cost || 0,
      unit_price: body.unit_price || 0,
      currency: body.currency || 'USD',
      is_active: body.is_active !== false,
      is_taxable: body.is_taxable !== false,
      tax_rate: body.tax_rate || null,
      image_url: body.image_url || null,

      // New inventory category fields
      inventory_category: body.inventory_category || 'physical_stock',
      stock_type: body.stock_type || 'consumable',
      item_condition: body.item_condition || 'new',
      valuation_method: body.valuation_method || 'weighted_average',
      
      // Stock tracking fields
      track_inventory: body.track_inventory !== false,
      quantity_on_hand: body.quantity_on_hand || 0,
      quantity_reserved: body.quantity_reserved || 0,
      reorder_point: body.reorder_point || 0,
      reorder_quantity: body.reorder_quantity || 0,

      // Account mapping
      inventory_account_id: body.inventory_account_id || inventoryAccount?.id,
      cogs_account_id: body.cogs_account_id || cogsAccount?.id,
      revenue_account_id: body.revenue_account_id || null,
    };

    // Add reusable equipment fields if applicable
    if (body.stock_type === 'reusable') {
      insertData.last_maintenance_date = body.last_maintenance_date || null;
      insertData.next_maintenance_date = body.next_maintenance_date || null;
      insertData.maintenance_interval_days = body.maintenance_interval_days || null;
    }

    // Add tour product fields if applicable
    if (body.inventory_category === 'tour_product') {
      insertData.tour_duration_hours = body.tour_duration_hours || null;
      insertData.min_participants = body.min_participants || 1;
      insertData.max_participants = body.max_participants || 10;
      insertData.includes_equipment = body.includes_equipment || false;
      insertData.equipment_list = body.equipment_list || [];
      insertData.required_permits = body.required_permits || [];
      insertData.difficulty_level = body.difficulty_level || null;
      insertData.age_restriction = body.age_restriction || null;
      insertData.seasonal_availability = body.seasonal_availability || null;
    }

    // Add permit fields if applicable
    if (body.inventory_category === 'permit') {
      insertData.permit_number = body.permit_number || null;
      insertData.permit_type = body.permit_type || null;
      insertData.issuing_authority = body.issuing_authority || null;
      insertData.permit_issue_date = body.permit_issue_date || null;
      insertData.permit_expiry_date = body.permit_expiry_date || null;
      insertData.permit_status = body.permit_status || 'active';
      insertData.permit_cost = body.permit_cost || 0;
      insertData.annual_quota = body.annual_quota || null;
      insertData.quota_used = body.quota_used || 0;
      insertData.renewal_reminder_days = body.renewal_reminder_days || 30;
      insertData.linked_product_ids = body.linked_product_ids || [];
      insertData.track_inventory = false; // Permits don't track physical inventory
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If tracking inventory and a default location exists, create stock location record
    if (insertData.track_inventory && insertData.quantity_on_hand > 0) {
      const { data: defaultLocation } = await supabase
        .from('inventory_locations')
        .select('id')
        .eq('is_default', true)
        .single();

      if (defaultLocation) {
        await supabase
          .from('product_stock_locations')
          .insert({
            product_id: data.id,
            location_id: defaultLocation.id,
            quantity_on_hand: insertData.quantity_on_hand,
            quantity_reserved: 0,
          });
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

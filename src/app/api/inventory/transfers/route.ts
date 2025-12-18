import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/transfers - List all stock transfers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const fromLocation = searchParams.get('from_location');
    const toLocation = searchParams.get('to_location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('stock_transfers')
      .select(`
        *,
        from_location:inventory_locations!stock_transfers_from_location_id_fkey(id, name, code),
        to_location:inventory_locations!stock_transfers_to_location_id_fkey(id, name, code),
        created_by_user:user_profiles!stock_transfers_created_by_fkey(id, full_name),
        items:stock_transfer_items(
          id,
          product_id,
          quantity_requested,
          quantity_shipped,
          quantity_received,
          unit_cost,
          product:products(id, sku, name, unit_of_measure)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (fromLocation) {
      query = query.eq('from_location_id', fromLocation);
    }

    if (toLocation) {
      query = query.eq('to_location_id', toLocation);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/transfers - Create a new stock transfer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.from_location_id || !body.to_location_id || !body.items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: from_location_id, to_location_id, items' },
        { status: 400 }
      );
    }

    if (body.from_location_id === body.to_location_id) {
      return NextResponse.json(
        { error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate items have sufficient stock
    for (const item of body.items) {
      const { data: stock } = await supabase
        .from('product_stock_locations')
        .select('quantity_on_hand, quantity_reserved')
        .eq('product_id', item.product_id)
        .eq('location_id', body.from_location_id)
        .single();

      if (!stock) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found at source location` },
          { status: 400 }
        );
      }

      const available = (stock.quantity_on_hand || 0) - (stock.quantity_reserved || 0);
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${item.product_id}. Available: ${available}` },
          { status: 400 }
        );
      }
    }

    // Generate transfer number
    const { count: transferCount } = await supabase
      .from('stock_transfers')
      .select('*', { count: 'exact', head: true });

    const transferNumber = `TRF-${String((transferCount || 0) + 1).padStart(5, '0')}`;

    // Create transfer
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        transfer_number: transferNumber,
        from_location_id: body.from_location_id,
        to_location_id: body.to_location_id,
        status: 'pending',
        notes: body.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 400 });
    }

    // Create transfer items
    const transferItems = body.items.map((item: any) => ({
      transfer_id: transfer.id,
      product_id: item.product_id,
      quantity_requested: item.quantity,
      quantity_shipped: 0,
      quantity_received: 0,
      unit_cost: item.unit_cost || 0,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('stock_transfer_items')
      .insert(transferItems)
      .select();

    if (itemsError) {
      // Rollback transfer
      await supabase.from('stock_transfers').delete().eq('id', transfer.id);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        ...transfer,
        items,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

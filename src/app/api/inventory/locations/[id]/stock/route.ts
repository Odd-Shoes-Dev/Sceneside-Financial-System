import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/locations/[id]/stock - Get all stock at a location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('low_stock');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get stock items at this location with product details
    let query = supabase
      .from('product_stock_locations')
      .select(`
        *,
        product:products(
          id,
          sku,
          name,
          description,
          category_id,
          stock_type,
          inventory_category,
          unit_of_measure,
          cost_price,
          unit_price,
          currency,
          reorder_point,
          image_url
        )
      `, { count: 'exact' })
      .eq('location_id', id)
      .order('product_id');

    // Note: Search filtering is done after fetching because we're filtering on joined data
    const { data: allData, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let filteredData = allData || [];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((item: any) => 
        item.product?.name?.toLowerCase().includes(searchLower) ||
        item.product?.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (category) {
      filteredData = filteredData.filter((item: any) => 
        item.product?.category_id === category
      );
    }

    // Apply low stock filter
    if (lowStock === 'true') {
      filteredData = filteredData.filter((item: any) => 
        (item.quantity_on_hand || 0) <= (item.product?.reorder_point || 0)
      );
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/locations/[id]/stock - Add stock to a location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.product_id) {
      return NextResponse.json(
        { error: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product already has stock at this location
    const { data: existingStock } = await supabase
      .from('product_stock_locations')
      .select('*')
      .eq('product_id', body.product_id)
      .eq('location_id', id)
      .single();

    if (existingStock) {
      // Update existing stock
      const newQuantity = (existingStock.quantity_on_hand || 0) + (body.quantity || 0);
      
      const { data, error } = await supabase
        .from('product_stock_locations')
        .update({
          quantity_on_hand: newQuantity,
          bin_location: body.bin_location || existingStock.bin_location,
          notes: body.notes || existingStock.notes,
        })
        .eq('id', existingStock.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Create inventory transaction record
      await supabase.from('inventory_transactions').insert({
        product_id: body.product_id,
        location_id: id,
        transaction_type: 'receive',
        quantity: body.quantity || 0,
        unit_cost: body.unit_cost || 0,
        reference_type: 'adjustment',
        notes: body.notes || 'Stock added to location',
        performed_by: user.id,
      });

      // Sync totals
      await supabase.rpc('sync_product_inventory_totals', { p_product_id: body.product_id });

      return NextResponse.json({ data });
    } else {
      // Create new stock record
      const { data, error } = await supabase
        .from('product_stock_locations')
        .insert({
          product_id: body.product_id,
          location_id: id,
          quantity_on_hand: body.quantity || 0,
          quantity_reserved: 0,
          bin_location: body.bin_location || null,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Create inventory transaction record
      await supabase.from('inventory_transactions').insert({
        product_id: body.product_id,
        location_id: id,
        transaction_type: 'receive',
        quantity: body.quantity || 0,
        unit_cost: body.unit_cost || 0,
        reference_type: 'adjustment',
        notes: body.notes || 'Initial stock at location',
        performed_by: user.id,
      });

      // Sync totals
      await supabase.rpc('sync_product_inventory_totals', { p_product_id: body.product_id });

      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

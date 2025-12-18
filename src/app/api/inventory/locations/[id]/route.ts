import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/locations/[id] - Get a single location with stock summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get location details
    const { data: location, error } = await supabase
      .from('inventory_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Get stock summary for this location
    const { data: stockSummary } = await supabase
      .from('v_location_stock_summary')
      .select('*')
      .eq('location_id', id)
      .single();

    return NextResponse.json({
      ...location,
      stock_summary: stockSummary || {
        total_products: 0,
        total_quantity: 0,
        total_value: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory/locations/[id] - Update a location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // If updating code, check uniqueness
    if (body.code) {
      const { data: existing } = await supabase
        .from('inventory_locations')
        .select('id')
        .eq('code', body.code)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'A location with this code already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.location_type !== undefined) updateData.location_type = body.location_type;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('inventory_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If this is set as default, unset others
    if (body.is_default) {
      await supabase
        .from('inventory_locations')
        .update({ is_default: false })
        .neq('id', id);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory/locations/[id] - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if location has stock
    const { data: stockCheck } = await supabase
      .from('product_stock_locations')
      .select('id')
      .eq('location_id', id)
      .gt('quantity_on_hand', 0)
      .limit(1);

    if (stockCheck && stockCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with existing stock. Transfer or remove stock first.' },
        { status: 400 }
      );
    }

    // Check if location has pending transfers
    const { data: transferCheck } = await supabase
      .from('stock_transfers')
      .select('id')
      .or(`from_location_id.eq.${id},to_location_id.eq.${id}`)
      .in('status', ['pending', 'in_transit'])
      .limit(1);

    if (transferCheck && transferCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with pending transfers.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('inventory_locations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

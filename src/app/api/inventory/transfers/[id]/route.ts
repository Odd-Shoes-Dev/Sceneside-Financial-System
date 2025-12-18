import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/transfers/[id] - Get a single transfer with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: transfer, error } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        from_location:inventory_locations!stock_transfers_from_location_id_fkey(id, name, code, address),
        to_location:inventory_locations!stock_transfers_to_location_id_fkey(id, name, code, address),
        created_by_user:user_profiles!stock_transfers_created_by_fkey(id, full_name),
        shipped_by_user:user_profiles!stock_transfers_shipped_by_fkey(id, full_name),
        received_by_user:user_profiles!stock_transfers_received_by_fkey(id, full_name),
        items:stock_transfer_items(
          id,
          product_id,
          quantity_requested,
          quantity_shipped,
          quantity_received,
          unit_cost,
          notes,
          product:products(id, sku, name, description, unit_of_measure, image_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: transfer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory/transfers/[id] - Update a transfer (only pending transfers)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if transfer is pending
    const { data: existing } = await supabase
      .from('stock_transfers')
      .select('status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending transfers can be modified' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from('stock_transfers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json({ data: existing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory/transfers/[id] - Cancel a transfer (only pending transfers)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if transfer is pending
    const { data: existing } = await supabase
      .from('stock_transfers')
      .select('status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending transfers can be cancelled' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error } = await supabase
      .from('stock_transfers')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

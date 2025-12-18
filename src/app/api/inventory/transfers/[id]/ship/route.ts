import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/inventory/transfers/[id]/ship - Ship a transfer (move from pending to in_transit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get transfer and items
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        items:stock_transfer_items(
          id,
          product_id,
          quantity_requested,
          quantity_shipped
        )
      `)
      .eq('id', id)
      .single();

    if (transferError) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot ship a transfer with status: ${transfer.status}` },
        { status: 400 }
      );
    }

    // Call the database function to ship the transfer
    const { data, error } = await supabase.rpc('ship_stock_transfer', {
      p_transfer_id: id,
      p_shipped_by: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Optionally update shipped quantities if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id && item.quantity_shipped !== undefined) {
          await supabase
            .from('stock_transfer_items')
            .update({ 
              quantity_shipped: item.quantity_shipped,
              notes: item.notes || null,
            })
            .eq('id', item.id);
        }
      }
    }

    // Fetch updated transfer
    const { data: updatedTransfer } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        from_location:inventory_locations!stock_transfers_from_location_id_fkey(id, name, code),
        to_location:inventory_locations!stock_transfers_to_location_id_fkey(id, name, code),
        items:stock_transfer_items(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({ data: updatedTransfer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

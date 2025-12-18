import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/inventory/transfers/[id]/receive - Receive a transfer (complete the transfer)
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

    // Get transfer
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        items:stock_transfer_items(
          id,
          product_id,
          quantity_shipped,
          quantity_received
        )
      `)
      .eq('id', id)
      .single();

    if (transferError) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'in_transit') {
      return NextResponse.json(
        { error: `Cannot receive a transfer with status: ${transfer.status}. Transfer must be shipped first.` },
        { status: 400 }
      );
    }

    // Update received quantities if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id && item.quantity_received !== undefined) {
          // Validate received quantity doesn't exceed shipped
          const transferItem = transfer.items.find((ti: any) => ti.id === item.id);
          if (transferItem && item.quantity_received > transferItem.quantity_shipped) {
            return NextResponse.json(
              { error: `Received quantity cannot exceed shipped quantity for item ${item.id}` },
              { status: 400 }
            );
          }

          await supabase
            .from('stock_transfer_items')
            .update({ 
              quantity_received: item.quantity_received,
              notes: item.notes || null,
            })
            .eq('id', item.id);
        }
      }
    }

    // Call the database function to receive the transfer
    const { data, error } = await supabase.rpc('receive_stock_transfer', {
      p_transfer_id: id,
      p_received_by: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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

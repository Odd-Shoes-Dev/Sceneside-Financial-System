import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/permits/[id] - Get a single permit with allocations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: permit, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('inventory_category', 'permit')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    // Get permit allocations
    const { data: allocations } = await supabase
      .from('permit_allocations')
      .select(`
        *,
        tour_schedule:tour_schedules(
          id,
          start_time,
          end_time,
          product:products(id, name)
        )
      `)
      .eq('permit_id', id)
      .order('allocation_date', { ascending: false });

    // Get linked products
    let linkedProducts: { id: string; sku: string | null; name: string; inventory_category: string | null }[] = [];
    if (permit.linked_product_ids && permit.linked_product_ids.length > 0) {
      const { data } = await supabase
        .from('products')
        .select('id, sku, name, inventory_category')
        .in('id', permit.linked_product_ids);
      linkedProducts = data || [];
    }

    return NextResponse.json({
      data: {
        ...permit,
        allocations,
        linked_products: linkedProducts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory/permits/[id] - Update a permit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if permit exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('inventory_category', 'permit')
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.permit_number !== undefined) updateData.permit_number = body.permit_number;
    if (body.permit_type !== undefined) updateData.permit_type = body.permit_type;
    if (body.issuing_authority !== undefined) updateData.issuing_authority = body.issuing_authority;
    if (body.permit_issue_date !== undefined) updateData.permit_issue_date = body.permit_issue_date;
    if (body.permit_expiry_date !== undefined) updateData.permit_expiry_date = body.permit_expiry_date;
    if (body.permit_status !== undefined) updateData.permit_status = body.permit_status;
    if (body.permit_cost !== undefined) updateData.permit_cost = body.permit_cost;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.annual_quota !== undefined) updateData.annual_quota = body.annual_quota;
    if (body.quota_used !== undefined) updateData.quota_used = body.quota_used;
    if (body.renewal_reminder_days !== undefined) updateData.renewal_reminder_days = body.renewal_reminder_days;
    if (body.linked_product_ids !== undefined) updateData.linked_product_ids = body.linked_product_ids;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory/permits/[id] - Deactivate a permit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if permit has active allocations
    const { data: activeAllocations } = await supabase
      .from('permit_allocations')
      .select('id')
      .eq('permit_id', id)
      .eq('status', 'active')
      .limit(1);

    if (activeAllocations && activeAllocations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete permit with active allocations. Deactivate instead.' },
        { status: 400 }
      );
    }

    // Deactivate instead of hard delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

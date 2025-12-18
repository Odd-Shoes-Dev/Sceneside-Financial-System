import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/inventory/equipment/[id]/maintenance - Log maintenance for equipment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.maintenance_type) {
      return NextResponse.json(
        { error: 'Missing required field: maintenance_type' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if equipment exists
    const { data: equipment } = await supabase
      .from('products')
      .select('maintenance_interval_days')
      .eq('id', id)
      .eq('stock_type', 'reusable')
      .single();

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Create maintenance record
    const { data: record, error } = await supabase
      .from('maintenance_records')
      .insert({
        product_id: id,
        maintenance_type: body.maintenance_type,
        maintenance_date: body.maintenance_date || new Date().toISOString(),
        performed_by: body.performed_by || null,
        cost: body.cost || 0,
        notes: body.notes || null,
        parts_replaced: body.parts_replaced || [],
        next_maintenance_due: body.next_maintenance_due || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update equipment with new maintenance dates
    const maintenanceDate = body.maintenance_date || new Date().toISOString().split('T')[0];
    let nextMaintenanceDate = body.next_maintenance_due;

    if (!nextMaintenanceDate && equipment.maintenance_interval_days) {
      const nextDate = new Date(maintenanceDate);
      nextDate.setDate(nextDate.getDate() + equipment.maintenance_interval_days);
      nextMaintenanceDate = nextDate.toISOString().split('T')[0];
    }

    const updateData: any = {
      last_maintenance_date: maintenanceDate,
    };

    if (nextMaintenanceDate) {
      updateData.next_maintenance_date = nextMaintenanceDate;
    }

    // Reset usage count if this was a service
    if (['repair', 'service', 'overhaul'].includes(body.maintenance_type)) {
      updateData.usage_count = 0;
    }

    // Update condition if specified
    if (body.condition_after) {
      updateData.item_condition = body.condition_after;
    }

    await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/inventory/equipment/[id]/maintenance - Get maintenance history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('maintenance_records')
      .select('*', { count: 'exact' })
      .eq('product_id', id)
      .order('maintenance_date', { ascending: false })
      .range(offset, offset + limit - 1);

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

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/equipment/[id] - Get a single equipment item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: equipment, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('stock_type', 'reusable')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Get current assignment
    const { data: assignment } = await supabase
      .from('equipment_assignments')
      .select(`
        *,
        tour_schedule:tour_schedules(
          id,
          start_time,
          end_time,
          product:products(id, name)
        )
      `)
      .eq('product_id', id)
      .eq('status', 'active')
      .single();

    // Get maintenance history
    const { data: maintenanceHistory } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('product_id', id)
      .order('maintenance_date', { ascending: false })
      .limit(10);

    // Get assignment history
    const { data: assignmentHistory } = await supabase
      .from('equipment_assignments')
      .select(`
        *,
        tour_schedule:tour_schedules(
          id,
          start_time,
          product:products(id, name)
        )
      `)
      .eq('product_id', id)
      .order('assigned_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        ...equipment,
        current_assignment: assignment,
        maintenance_history: maintenanceHistory || [],
        assignment_history: assignmentHistory || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory/equipment/[id] - Update equipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if equipment exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('stock_type', 'reusable')
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.cost_price !== undefined) updateData.cost_price = body.cost_price;
    if (body.unit_price !== undefined) updateData.unit_price = body.unit_price;
    if (body.item_condition !== undefined) updateData.item_condition = body.item_condition;
    if (body.last_maintenance_date !== undefined) updateData.last_maintenance_date = body.last_maintenance_date;
    if (body.next_maintenance_date !== undefined) updateData.next_maintenance_date = body.next_maintenance_date;
    if (body.maintenance_interval_days !== undefined) updateData.maintenance_interval_days = body.maintenance_interval_days;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;

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

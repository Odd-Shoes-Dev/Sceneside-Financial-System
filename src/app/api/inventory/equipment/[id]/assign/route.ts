import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/inventory/equipment/[id]/assign - Assign equipment to a tour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.schedule_id) {
      return NextResponse.json(
        { error: 'Missing required field: schedule_id' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if equipment exists and is available
    const { data: equipment } = await supabase
      .from('products')
      .select('id, name, item_condition')
      .eq('id', id)
      .eq('stock_type', 'reusable')
      .single();

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Check for existing active assignment
    const { data: existingAssignment } = await supabase
      .from('equipment_assignments')
      .select('id')
      .eq('product_id', id)
      .eq('status', 'active')
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Equipment is already assigned. Return it first.' },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const { data: schedule } = await supabase
      .from('tour_schedules')
      .select('id, status')
      .eq('id', body.schedule_id)
      .single();

    if (!schedule) {
      return NextResponse.json({ error: 'Tour schedule not found' }, { status: 404 });
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('equipment_assignments')
      .insert({
        product_id: id,
        schedule_id: body.schedule_id,
        assignment_type: body.assignment_type || 'tour',
        quantity: body.quantity || 1,
        assigned_at: new Date().toISOString(),
        assigned_by: user.id,
        status: 'active',
        notes: body.notes || null,
        condition_at_checkout: equipment.item_condition,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory/equipment/[id]/assign - Return equipment (end assignment)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get URL params for additional data
    const { searchParams } = new URL(request.url);
    const conditionAtReturn = searchParams.get('condition') || undefined;
    const notes = searchParams.get('notes') || undefined;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find active assignment
    const { data: assignment } = await supabase
      .from('equipment_assignments')
      .select('id')
      .eq('product_id', id)
      .eq('status', 'active')
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'No active assignment found for this equipment' },
        { status: 404 }
      );
    }

    // Update assignment
    const updateData: any = {
      status: 'returned',
      returned_at: new Date().toISOString(),
      returned_by: user.id,
    };

    if (conditionAtReturn) {
      updateData.condition_at_return = conditionAtReturn;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('equipment_assignments')
      .update(updateData)
      .eq('id', assignment.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update equipment condition if different
    if (conditionAtReturn) {
      await supabase
        .from('products')
        .update({ 
          item_condition: conditionAtReturn,
        })
        .eq('id', id);
    }

    // Increment usage count manually
    const { data: currentProduct } = await supabase
      .from('products')
      .select('usage_count')
      .eq('id', id)
      .single();
    
    if (currentProduct) {
      await supabase
        .from('products')
        .update({ usage_count: (currentProduct.usage_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

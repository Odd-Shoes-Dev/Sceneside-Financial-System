import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/tours/[id] - Get a single tour schedule with bookings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: schedule, error } = await supabase
      .from('tour_schedules')
      .select(`
        *,
        product:products(
          id, 
          sku, 
          name, 
          description, 
          unit_price,
          currency,
          tour_duration_hours, 
          min_participants, 
          max_participants,
          includes_equipment,
          equipment_list,
          difficulty_level,
          age_restriction,
          image_url
        ),
        bookings:tour_bookings(
          id,
          customer_id,
          invoice_line_id,
          participants,
          booking_status,
          payment_status,
          special_requests,
          created_at,
          customer:customers(id, name, email, phone)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Tour schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ data: schedule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory/tours/[id] - Update a tour schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Check if schedule exists and get current status
    const { data: existing } = await supabase
      .from('tour_schedules')
      .select('status, booked_capacity')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Tour schedule not found' }, { status: 404 });
    }

    // Prevent modifications to completed/cancelled tours
    if (['completed', 'cancelled'].includes(existing.status) && body.status !== existing.status) {
      return NextResponse.json(
        { error: `Cannot modify a ${existing.status} tour` },
        { status: 400 }
      );
    }

    // If changing max_capacity, ensure it's not less than booked
    if (body.max_capacity !== undefined && body.max_capacity < existing.booked_capacity) {
      return NextResponse.json(
        { error: `Cannot set capacity below booked amount (${existing.booked_capacity})` },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.max_capacity !== undefined) {
      updateData.max_capacity = body.max_capacity;
      updateData.available_capacity = body.max_capacity - existing.booked_capacity;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.guide_name !== undefined) updateData.guide_name = body.guide_name;
    if (body.guide_contact !== undefined) updateData.guide_contact = body.guide_contact;
    if (body.meeting_point !== undefined) updateData.meeting_point = body.meeting_point;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('tour_schedules')
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

// DELETE /api/inventory/tours/[id] - Cancel a tour schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if schedule has bookings
    const { data: existing } = await supabase
      .from('tour_schedules')
      .select('status, booked_capacity')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Tour schedule not found' }, { status: 404 });
    }

    if (existing.booked_capacity > 0) {
      // Cancel instead of delete
      const { error } = await supabase
        .from('tour_schedules')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Update all bookings to cancelled
      await supabase
        .from('tour_bookings')
        .update({ booking_status: 'cancelled' })
        .eq('schedule_id', id)
        .in('booking_status', ['pending', 'confirmed']);

      return NextResponse.json({ 
        success: true, 
        message: 'Tour cancelled. Existing bookings have been cancelled.' 
      });
    }

    // No bookings, safe to delete
    const { error } = await supabase
      .from('tour_schedules')
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

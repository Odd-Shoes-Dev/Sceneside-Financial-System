import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/tours/[id]/bookings - List bookings for a tour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');

    let query = supabase
      .from('tour_bookings')
      .select(`
        *,
        customer:customers(id, name, email, phone),
        invoice_line:invoice_lines(
          id,
          invoice_id,
          invoice:invoices(id, invoice_number, status)
        )
      `)
      .eq('schedule_id', id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('booking_status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/tours/[id]/bookings - Create a booking for a tour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.customer_id || !body.participants) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, participants' },
        { status: 400 }
      );
    }

    // Get schedule to check availability
    const { data: schedule } = await supabase
      .from('tour_schedules')
      .select('*, product:products(min_participants)')
      .eq('id', id)
      .single();

    if (!schedule) {
      return NextResponse.json({ error: 'Tour schedule not found' }, { status: 404 });
    }

    if (schedule.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot book a tour with status: ${schedule.status}` },
        { status: 400 }
      );
    }

    if (body.participants > schedule.available_capacity) {
      return NextResponse.json(
        { error: `Insufficient capacity. Available: ${schedule.available_capacity}` },
        { status: 400 }
      );
    }

    const { data: booking, error } = await supabase
      .from('tour_bookings')
      .insert({
        schedule_id: id,
        customer_id: body.customer_id,
        invoice_line_id: body.invoice_line_id || null,
        participants: body.participants,
        booking_status: body.booking_status || 'pending',
        payment_status: body.payment_status || 'unpaid',
        special_requests: body.special_requests || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // The trigger will automatically update the schedule capacity

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/tours - List all tour schedules
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tour_schedules')
      .select(`
        *,
        product:products(id, sku, name, description, tour_duration_hours, min_participants, max_participants),
        bookings:tour_bookings(count)
      `, { count: 'exact' })
      .order('start_time', { ascending: true });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

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

// POST /api/inventory/tours - Create a new tour schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.product_id || !body.start_time) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, start_time' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product to get default capacity
    const { data: product } = await supabase
      .from('products')
      .select('max_participants, tour_duration_hours, inventory_category')
      .eq('id', body.product_id)
      .single();

    if (!product || product.inventory_category !== 'tour_product') {
      return NextResponse.json(
        { error: 'Invalid product or product is not a tour' },
        { status: 400 }
      );
    }

    // Calculate end time if not provided
    let endTime = body.end_time;
    if (!endTime && product.tour_duration_hours) {
      const start = new Date(body.start_time);
      start.setHours(start.getHours() + product.tour_duration_hours);
      endTime = start.toISOString();
    }

    const maxCapacity = body.max_capacity || product.max_participants || 10;

    const { data, error } = await supabase
      .from('tour_schedules')
      .insert({
        product_id: body.product_id,
        start_time: body.start_time,
        end_time: endTime,
        max_capacity: maxCapacity,
        booked_capacity: 0,
        available_capacity: maxCapacity,
        status: 'scheduled',
        guide_name: body.guide_name || null,
        guide_contact: body.guide_contact || null,
        meeting_point: body.meeting_point || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

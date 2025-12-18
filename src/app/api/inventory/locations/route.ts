import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/inventory/locations - List all inventory locations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('inventory_locations')
      .select('*', { count: 'exact' })
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('location_type', type);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
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

// POST /api/inventory/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const { data: existing } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('code', body.code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A location with this code already exists' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inventory_locations')
      .insert({
        code: body.code,
        name: body.name,
        location_type: body.location_type || 'warehouse',
        address: body.address || null,
        is_active: body.is_active !== false,
        is_default: body.is_default || false,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If this is set as default, unset others
    if (body.is_default) {
      await supabase
        .from('inventory_locations')
        .update({ is_default: false })
        .neq('id', data.id);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

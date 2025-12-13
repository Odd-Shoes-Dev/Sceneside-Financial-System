import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/accounts - List accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('accounts')
      .select('id, code, name, account_type, account_subtype, is_active')
      .order('code');

    if (type) {
      query = query.eq('account_type', type);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

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

// POST /api/accounts - Create account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.code || !body.name || !body.account_type) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, account_type' },
        { status: 400 }
      );
    }

    // Check if account code already exists
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', body.code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this code already exists' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        code: body.code,
        name: body.name,
        description: body.description || null,
        account_type: body.account_type,
        account_subtype: body.account_subtype || null,
        parent_id: body.parent_id || null,
        currency: body.currency || 'USD',
        is_active: body.is_active !== false,
        normal_balance: body.normal_balance || 'debit',
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
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/bank-accounts - List bank accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const active = searchParams.get('active');

    let query = supabase
      .from('bank_accounts')
      .select('*')
      .order('name');

    if (active === 'true') {
      query = query.eq('is_active', true);
    } else if (active === 'false') {
      query = query.eq('is_active', false);
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

// POST /api/bank-accounts - Create bank account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.bank_name) {
      return NextResponse.json(
        { error: 'Account name and bank name are required' },
        { status: 400 }
      );
    }

    // If this is marked as primary, unset other primary accounts
    if (body.is_primary) {
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('is_primary', true);
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        name: body.name,
        bank_name: body.bank_name,
        account_number_encrypted: null, // Would need encryption in production
        routing_number: body.routing_number || null,
        account_type: body.account_type || 'checking',
        currency: body.currency || 'USD',
        is_primary: body.is_primary || false,
        is_active: body.is_active !== false,
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

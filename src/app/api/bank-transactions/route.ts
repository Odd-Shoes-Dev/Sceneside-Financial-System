import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/bank-transactions - Create a bank transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.bank_account_id || !body.transaction_date || !body.amount || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: bank_account_id, transaction_date, amount, description' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        bank_account_id: body.bank_account_id,
        transaction_date: body.transaction_date,
        amount: body.amount,
        description: body.description,
        reference: body.reference || null,
        payee_payer: body.payee_payer || null,
        transaction_type: body.transaction_type || 'other',
        is_reconciled: false,
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

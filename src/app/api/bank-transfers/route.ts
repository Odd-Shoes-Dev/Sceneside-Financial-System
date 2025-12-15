import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/bank-transfers - Create a bank transfer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.from_account_id || !body.to_account_id || !body.amount || !body.transfer_date) {
      return NextResponse.json(
        { error: 'Missing required fields: from_account_id, to_account_id, amount, transfer_date' },
        { status: 400 }
      );
    }

    if (body.from_account_id === body.to_account_id) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account names for better descriptions
    const { data: fromAccount } = await supabase
      .from('bank_accounts')
      .select('name')
      .eq('id', body.from_account_id)
      .single();

    const { data: toAccount } = await supabase
      .from('bank_accounts')
      .select('name')
      .eq('id', body.to_account_id)
      .single();

    // Generate reference if not provided
    const reference_number = body.reference_number || `TRF-${Date.now().toString(36).toUpperCase()}`;

    // Create two bank transactions: debit from source, credit to destination
    const transactions = [
      {
        bank_account_id: body.from_account_id,
        transaction_date: body.transfer_date,
        amount: -Math.abs(body.amount), // Negative for withdrawal
        description: `Transfer to ${toAccount?.name || 'account'}`,
        reference_number: reference_number,
        transaction_type: 'transfer_out',
        is_reconciled: false,
      },
      {
        bank_account_id: body.to_account_id,
        transaction_date: body.transfer_date,
        amount: Math.abs(body.amount), // Positive for deposit
        description: `Transfer from ${fromAccount?.name || 'account'}`,
        reference_number: reference_number,
        transaction_type: 'transfer_in',
        is_reconciled: false,
      },
    ];

    const { data, error } = await supabase
      .from('bank_transactions')
      .insert(transactions)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      data,
      message: 'Transfer completed successfully' 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendor_id');
    const accountId = searchParams.get('account_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('expenses')
      .select(`
        *,
        vendors (id, name),
        accounts:expense_account_id (id, name, code),
        bank_accounts (id, name)
      `, { count: 'exact' })
      .order('expense_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (accountId) {
      query = query.eq('expense_account_id', accountId);
    }

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    if (endDate) {
      query = query.lte('expense_date', endDate);
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

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body.expense_date || !body.amount || !body.expense_account_id) {
      return NextResponse.json(
        { error: 'Missing required fields: expense_date, amount, expense_account_id' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate expense reference
    const date = new Date();
    const ref = `EXP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        reference: body.reference || ref,
        expense_date: body.expense_date,
        vendor_id: body.vendor_id || null,
        expense_account_id: body.expense_account_id,
        amount: body.amount,
        tax_amount: body.tax_amount || 0,
        description: body.description || null,
        payment_method: body.payment_method || 'cash',
        bank_account_id: body.bank_account_id || null,
        receipt_url: body.receipt_url || null,
        is_billable: body.is_billable || false,
        customer_id: body.customer_id || null,
        status: body.status || 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (expenseError) {
      return NextResponse.json({ error: expenseError.message }, { status: 400 });
    }

    // If paid, post to GL
    if (body.status === 'paid' && body.bank_account_id) {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('gl_account_id')
        .eq('id', body.bank_account_id)
        .single();

      if (bankAccount?.gl_account_id) {
        // Create journal entry
        const { data: journalEntry, error: jeError } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: body.expense_date,
            reference: expense.reference,
            description: body.description || 'Expense payment',
            source_type: 'expense',
            source_id: expense.id,
            status: 'posted',
            created_by: user.id,
          })
          .select()
          .single();

        if (!jeError && journalEntry) {
          await supabase.from('journal_entry_lines').insert([
            {
              entry_id: journalEntry.id,
              account_id: body.expense_account_id,
              debit: body.amount,
              credit: 0,
              description: body.description || 'Expense',
            },
            {
              entry_id: journalEntry.id,
              account_id: bankAccount.gl_account_id,
              debit: 0,
              credit: body.amount,
              description: 'Payment',
            },
          ]);
        }
      }
    }

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

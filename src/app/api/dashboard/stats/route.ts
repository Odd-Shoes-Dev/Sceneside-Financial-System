import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all financial data
    const [
      { data: invoices },
      { data: bills },
      { data: expenses },
      { data: bankAccounts },
      { data: inventory },
    ] = await Promise.all([
      supabase.from('invoices').select('total, amount_paid, status, currency, invoice_date'),
      supabase.from('bills').select('total, amount_paid, status, currency, bill_date'),
      supabase.from('expenses').select('total, currency, expense_date'),
      supabase.from('bank_transactions').select('amount, type, currency, transaction_date'),
      supabase.from('products').select('quantity_on_hand, cost_price, currency').eq('track_inventory', true),
    ]);

    // Convert all amounts to USD
    let totalRevenue = 0;
    let totalExpenses = 0;
    let accountsReceivable = 0;
    let accountsPayable = 0;
    let cashBalance = 0;
    let inventoryValue = 0;

    // Process invoices
    if (invoices) {
      for (const invoice of invoices) {
        let amountInUSD = invoice.total;
        let remainingInUSD = invoice.total - (invoice.amount_paid || 0);

        if (invoice.currency !== 'USD') {
          const { data: convertedTotal } = await supabase.rpc('convert_currency', {
            p_amount: invoice.total,
            p_from_currency: invoice.currency,
            p_to_currency: 'USD',
            p_date: invoice.invoice_date,
          });

          const { data: convertedRemaining } = await supabase.rpc('convert_currency', {
            p_amount: invoice.total - (invoice.amount_paid || 0),
            p_from_currency: invoice.currency,
            p_to_currency: 'USD',
            p_date: invoice.invoice_date,
          });

          amountInUSD = convertedTotal || invoice.total;
          remainingInUSD = convertedRemaining || (invoice.total - (invoice.amount_paid || 0));
        }

        if (invoice.status === 'paid') {
          totalRevenue += amountInUSD;
        }
        
        if (invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled') {
          accountsReceivable += remainingInUSD;
        }
      }
    }

    // Process bills
    if (bills) {
      for (const bill of bills) {
        let remainingInUSD = bill.total - (bill.amount_paid || 0);

        if (bill.currency !== 'USD') {
          const { data: convertedRemaining } = await supabase.rpc('convert_currency', {
            p_amount: bill.total - (bill.amount_paid || 0),
            p_from_currency: bill.currency,
            p_to_currency: 'USD',
            p_date: bill.bill_date,
          });

          remainingInUSD = convertedRemaining || (bill.total - (bill.amount_paid || 0));
        }

        if (bill.status !== 'paid' && bill.status !== 'void') {
          accountsPayable += remainingInUSD;
        }
      }
    }

    // Process expenses
    if (expenses) {
      for (const expense of expenses) {
        let amountInUSD = expense.total;

        if (expense.currency !== 'USD') {
          const { data: converted } = await supabase.rpc('convert_currency', {
            p_amount: expense.total,
            p_from_currency: expense.currency,
            p_to_currency: 'USD',
            p_date: expense.expense_date,
          });

          amountInUSD = converted || expense.total;
        }

        totalExpenses += amountInUSD;
      }
    }

    // Process bank transactions for cash balance
    if (bankAccounts) {
      for (const transaction of bankAccounts) {
        let amountInUSD = transaction.amount;

        if (transaction.currency !== 'USD') {
          const { data: converted } = await supabase.rpc('convert_currency', {
            p_amount: transaction.amount,
            p_from_currency: transaction.currency,
            p_to_currency: 'USD',
            p_date: transaction.transaction_date,
          });

          amountInUSD = converted || transaction.amount;
        }

        if (transaction.type === 'deposit' || transaction.type === 'credit') {
          cashBalance += amountInUSD;
        } else {
          cashBalance -= amountInUSD;
        }
      }
    }

    // Process inventory
    if (inventory) {
      for (const item of inventory) {
        const quantity = item.quantity_on_hand || 0;
        const cost = item.cost_price || 0;
        const itemValue = quantity * cost;

        if (itemValue > 0) {
          let valueInUSD = itemValue;

          if (item.currency && item.currency !== 'USD') {
            const { data: converted } = await supabase.rpc('convert_currency', {
              p_amount: itemValue,
              p_from_currency: item.currency,
              p_to_currency: 'USD',
              p_date: new Date().toISOString().split('T')[0],
            });

            valueInUSD = converted || itemValue;
          }

          inventoryValue += valueInUSD;
        }
      }
    }

    const netIncome = totalRevenue - totalExpenses;

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      netIncome,
      accountsReceivable,
      accountsPayable,
      cashBalance,
      inventoryValue,
    });
  } catch (error: any) {
    console.error('Failed to calculate dashboard stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports/trial-balance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];

    // Get all accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, account_type, normal_balance')
      .eq('is_active', true)
      .order('code');

    // Get all posted journal entry lines up to the date
    const { data: entries } = await supabase
      .from('journal_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entry:journal_entries!inner (entry_date, status)
      `)
      .eq('journal_entry.status', 'posted')
      .lte('journal_entry.entry_date', asOfDate);

    // Calculate balances by account
    const accountTotals: Record<string, { debit: number; credit: number }> = {};
    
    entries?.forEach((entry: any) => {
      if (!accountTotals[entry.account_id]) {
        accountTotals[entry.account_id] = { debit: 0, credit: 0 };
      }
      accountTotals[entry.account_id].debit += entry.debit || 0;
      accountTotals[entry.account_id].credit += entry.credit || 0;
    });

    // Build trial balance
    const trialBalance: any[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    accounts?.forEach((account) => {
      const totals = accountTotals[account.id] || { debit: 0, credit: 0 };
      const netDebit = totals.debit - totals.credit;
      
      // Skip accounts with no activity
      if (totals.debit === 0 && totals.credit === 0) return;

      let debitBalance = 0;
      let creditBalance = 0;

      if (netDebit > 0) {
        debitBalance = netDebit;
        totalDebits += netDebit;
      } else if (netDebit < 0) {
        creditBalance = -netDebit;
        totalCredits += -netDebit;
      }

      trialBalance.push({
        code: account.code,
        name: account.name,
        type: account.account_type,
        debit: debitBalance,
        credit: creditBalance,
      });
    });

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return NextResponse.json({
      asOfDate,
      accounts: trialBalance,
      totals: {
        totalDebits: totalDebits,
        totalCredits: totalCredits,
        isBalanced,
      },
      difference: totalDebits - totalCredits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

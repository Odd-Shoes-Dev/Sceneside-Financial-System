import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports/balance-sheet
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];

    // Get all accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, account_type, normal_balance')
      .order('code');

    // Get all posted journal entry lines up to the date
    const { data: entries, error: entriesError } = await supabase
      .from('journal_lines')
      .select(`
        account_id,
        debit,
        credit,
        journal_entries!inner (entry_date, status)
      `)
      .eq('journal_entries.status', 'posted')
      .lte('journal_entries.entry_date', asOfDate);

    if (entriesError) {
      console.error('Error fetching journal entries:', entriesError);
    }

    // Calculate balances by account
    const accountBalances: Record<string, number> = {};
    
    entries?.forEach((entry: any) => {
      if (!accountBalances[entry.account_id]) {
        accountBalances[entry.account_id] = 0;
      }
      accountBalances[entry.account_id] += (entry.debit || 0) - (entry.credit || 0);
    });

    // Build sections
    const currentAssets: any[] = [];
    const fixedAssets: any[] = [];
    const otherAssets: any[] = [];
    const currentLiabilities: any[] = [];
    const longTermLiabilities: any[] = [];
    const equity: any[] = [];

    let totalCurrentAssets = 0;
    let totalFixedAssets = 0;
    let totalOtherAssets = 0;
    let totalCurrentLiabilities = 0;
    let totalLongTermLiabilities = 0;
    let totalEquity = 0;

    accounts?.forEach((account) => {
      let balance = accountBalances[account.id] || 0;
      
      // Adjust for normal balance (liabilities/equity have credit normal)
      if (account.normal_balance === 'credit') {
        balance = -balance;
      }

      if (balance === 0) return;

      const item = {
        code: account.code,
        name: account.name,
        amount: Math.abs(balance),
      };

      const code = account.code;

      // Assets (1xxx)
      if (code.startsWith('1')) {
        if (code < '1500') {
          currentAssets.push(item);
          totalCurrentAssets += balance;
        } else if (code < '1800') {
          fixedAssets.push(item);
          totalFixedAssets += balance;
        } else {
          otherAssets.push(item);
          totalOtherAssets += balance;
        }
      }
      // Liabilities (2xxx)
      else if (code.startsWith('2')) {
        if (code < '2500') {
          currentLiabilities.push(item);
          totalCurrentLiabilities += balance;
        } else {
          longTermLiabilities.push(item);
          totalLongTermLiabilities += balance;
        }
      }
      // Equity (3xxx)
      else if (code.startsWith('3')) {
        equity.push(item);
        totalEquity += balance;
      }
    });

    // Calculate retained earnings (net income for all time)
    // This is a simplified calculation - in production you'd close periods
    const { data: incomeEntries } = await supabase
      .from('journal_lines')
      .select(`
        account_id,
        debit,
        credit,
        accounts!inner (code),
        journal_entries!inner (entry_date, status)
      `)
      .eq('journal_entries.status', 'posted')
      .lte('journal_entries.entry_date', asOfDate)
      .gte('accounts.code', '4000');

    let retainedEarnings = 0;
    incomeEntries?.forEach((entry: any) => {
      const code = entry.accounts.code;
      if (code >= '4000' && code < '5000') {
        // Revenue - credit increases
        retainedEarnings += (entry.credit || 0) - (entry.debit || 0);
      } else {
        // Expenses - debit increases
        retainedEarnings -= (entry.debit || 0) - (entry.credit || 0);
      }
    });

    if (retainedEarnings !== 0) {
      equity.push({
        code: '3900',
        name: 'Retained Earnings',
        amount: Math.abs(retainedEarnings),
      });
      totalEquity += retainedEarnings;
    }

    const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return NextResponse.json({
      data: {
        asOfDate,
        assets: {
          current: {
            items: currentAssets,
            total: totalCurrentAssets,
          },
          fixed: {
            items: fixedAssets,
            total: totalFixedAssets,
          },
          other: {
            items: otherAssets,
            total: totalOtherAssets,
          },
          total: totalAssets,
        },
        liabilities: {
          current: {
            items: currentLiabilities,
            total: totalCurrentLiabilities,
          },
          longTerm: {
            items: longTermLiabilities,
            total: totalLongTermLiabilities,
          },
          total: totalLiabilities,
        },
        equity: {
          items: equity,
          total: totalEquity,
        },
        totalLiabilitiesAndEquity,
        isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

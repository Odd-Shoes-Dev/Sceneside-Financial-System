import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Get beginning cash balance
    const { data: beginningBalanceData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(code, account_type)
      `)
      .lt('journal_entry.entry_date', startDate)
      .eq('journal_entry.status', 'posted')
      .in('account.code', ['1010', '1020', '1030']); // Cash accounts

    const beginningCash = beginningBalanceData?.reduce((sum, line) => {
      return sum + (line.debit || 0) - (line.credit || 0);
    }, 0) || 0;

    // Get period transactions for cash accounts
    const { data: periodCashData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status, description, source_module),
        account:accounts!inner(code, account_type, name)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .in('account.code', ['1010', '1020', '1030']);

    // Calculate net change in cash
    const netChangeInCash = periodCashData?.reduce((sum, line) => {
      return sum + (line.debit || 0) - (line.credit || 0);
    }, 0) || 0;

    // Get revenue for period (for net income calculation)
    const { data: revenueData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(account_type)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .eq('account.account_type', 'revenue');

    const totalRevenue = revenueData?.reduce((sum, line) => {
      return sum + (line.credit || 0) - (line.debit || 0);
    }, 0) || 0;

    // Get expenses for period
    const { data: expenseData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(account_type)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .eq('account.account_type', 'expense');

    const totalExpenses = expenseData?.reduce((sum, line) => {
      return sum + (line.debit || 0) - (line.credit || 0);
    }, 0) || 0;

    const netIncome = totalRevenue - totalExpenses;

    // Get depreciation expense
    const { data: depreciationData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .eq('account.code', '6900'); // Depreciation expense

    const depreciation = depreciationData?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;

    // Get changes in AR
    const { data: arChangeData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .eq('account.code', '1200'); // AR

    const arChange = arChangeData?.reduce((sum, line) => {
      return sum + (line.debit || 0) - (line.credit || 0);
    }, 0) || 0;

    // Get changes in AP
    const { data: apChangeData } = await supabase
      .from('journal_lines')
      .select(`
        debit,
        credit,
        journal_entry:journal_entries!inner(entry_date, status),
        account:accounts!inner(code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.status', 'posted')
      .eq('account.code', '2010'); // AP

    const apChange = apChangeData?.reduce((sum, line) => {
      return sum + (line.credit || 0) - (line.debit || 0);
    }, 0) || 0;

    // Get fixed asset purchases
    const { data: assetPurchases } = await supabase
      .from('fixed_assets')
      .select('purchase_cost')
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    const assetPurchaseTotal = assetPurchases?.reduce((sum, a) => sum + (a.purchase_cost || 0), 0) || 0;

    // Build the response
    const cashFlowStatement = {
      period: {
        startDate,
        endDate,
      },
      operatingActivities: {
        netIncome,
        adjustments: [
          { label: 'Depreciation', amount: depreciation },
        ],
        changesInWorkingCapital: [
          { label: 'Increase in Accounts Receivable', amount: -arChange },
          { label: 'Increase in Accounts Payable', amount: apChange },
        ],
        netCashFromOperating: netIncome + depreciation - arChange + apChange,
      },
      investingActivities: {
        items: [
          { label: 'Purchase of Fixed Assets', amount: -assetPurchaseTotal },
        ],
        netCashFromInvesting: -assetPurchaseTotal,
      },
      financingActivities: {
        items: [
          { label: 'Owner Contributions', amount: 0 },
          { label: 'Owner Distributions', amount: 0 },
        ],
        netCashFromFinancing: 0,
      },
      netChangeInCash,
      beginningCash,
      endingCash: beginningCash + netChangeInCash,
    };

    return NextResponse.json(cashFlowStatement);
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

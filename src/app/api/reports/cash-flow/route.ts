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
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_code, account_type)
      `)
      .lt('journal_entry.entry_date', startDate)
      .eq('journal_entry.is_posted', true)
      .in('account.account_code', ['1010', '1020', '1030']); // Cash accounts

    const beginningCash = beginningBalanceData?.reduce((sum, line) => {
      return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
    }, 0) || 0;

    // Get period transactions for cash accounts
    const { data: periodCashData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted, description, source),
        account:chart_of_accounts!inner(account_code, account_type, account_name)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .in('account.account_code', ['1010', '1020', '1030']);

    // Calculate net change in cash
    const netChangeInCash = periodCashData?.reduce((sum, line) => {
      return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
    }, 0) || 0;

    // Get revenue for period (for net income calculation)
    const { data: revenueData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_type)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .eq('account.account_type', 'Revenue');

    const totalRevenue = revenueData?.reduce((sum, line) => {
      return sum + (line.credit_amount || 0) - (line.debit_amount || 0);
    }, 0) || 0;

    // Get expenses for period
    const { data: expenseData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_type)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .eq('account.account_type', 'Expense');

    const totalExpenses = expenseData?.reduce((sum, line) => {
      return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
    }, 0) || 0;

    const netIncome = totalRevenue - totalExpenses;

    // Get depreciation expense
    const { data: depreciationData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .eq('account.account_code', '6900'); // Depreciation expense

    const depreciation = depreciationData?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0;

    // Get changes in AR
    const { data: arChangeData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .eq('account.account_code', '1200'); // AR

    const arChange = arChangeData?.reduce((sum, line) => {
      return sum + (line.debit_amount || 0) - (line.credit_amount || 0);
    }, 0) || 0;

    // Get changes in AP
    const { data: apChangeData } = await supabase
      .from('journal_entry_lines')
      .select(`
        debit_amount,
        credit_amount,
        journal_entry:journal_entries!inner(entry_date, is_posted),
        account:chart_of_accounts!inner(account_code)
      `)
      .gte('journal_entry.entry_date', startDate)
      .lte('journal_entry.entry_date', endDate)
      .eq('journal_entry.is_posted', true)
      .eq('account.account_code', '2010'); // AP

    const apChange = apChangeData?.reduce((sum, line) => {
      return sum + (line.credit_amount || 0) - (line.debit_amount || 0);
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

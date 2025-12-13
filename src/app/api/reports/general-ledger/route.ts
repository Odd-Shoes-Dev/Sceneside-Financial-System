import { NextRequest, NextResponse } from 'next/server';

interface GeneralLedgerEntry {
  entryId: string;
  date: string;
  accountCode: string;
  accountName: string;
  accountType: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  description: string;
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
  journalType: 'General Journal' | 'Sales Journal' | 'Purchase Journal' | 'Cash Receipts' | 'Cash Disbursements' | 'Payroll Journal';
}

interface AccountSummary {
  accountCode: string;
  accountName: string;
  accountType: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  entryCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const accountFilter = searchParams.get('accountFilter') || 'all';
    const journalType = searchParams.get('journalType') || 'all';
    const searchTerm = searchParams.get('searchTerm') || '';

    // Generate comprehensive general ledger entries with realistic business scenarios
    const entries: GeneralLedgerEntry[] = [
      // Cash and Bank Accounts - Assets
      {
        entryId: 'gl001',
        date: '2024-12-01',
        accountCode: '1010',
        accountName: 'Cash - Operating Account',
        accountType: 'Assets',
        description: 'Initial cash balance',
        reference: 'BAL001',
        debit: 50000.00,
        credit: 0.00,
        runningBalance: 50000.00,
        journalType: 'General Journal'
      },
      {
        entryId: 'gl002',
        date: '2024-12-01',
        accountCode: '1020',
        accountName: 'Business Checking Account',
        accountType: 'Assets',
        description: 'Bank account opening balance',
        reference: 'BAL002',
        debit: 125000.00,
        credit: 0.00,
        runningBalance: 125000.00,
        journalType: 'General Journal'
      },
      
      // Sales Revenue Entries
      {
        entryId: 'gl003',
        date: '2024-12-02',
        accountCode: '4010',
        accountName: 'Service Revenue',
        accountType: 'Revenue',
        description: 'Professional services rendered - Client ABC',
        reference: 'INV-2024-001',
        debit: 0.00,
        credit: 8500.00,
        runningBalance: 8500.00,
        journalType: 'Sales Journal'
      },
      {
        entryId: 'gl004',
        date: '2024-12-02',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'Assets',
        description: 'Professional services rendered - Client ABC',
        reference: 'INV-2024-001',
        debit: 8500.00,
        credit: 0.00,
        runningBalance: 8500.00,
        journalType: 'Sales Journal'
      },
      
      // Purchase Transactions
      {
        entryId: 'gl005',
        date: '2024-12-03',
        accountCode: '5010',
        accountName: 'Office Supplies Expense',
        accountType: 'Expenses',
        description: 'Office supplies purchase - Staples',
        reference: 'PO-2024-001',
        debit: 450.00,
        credit: 0.00,
        runningBalance: 450.00,
        journalType: 'Purchase Journal'
      },
      {
        entryId: 'gl006',
        date: '2024-12-03',
        accountCode: '2010',
        accountName: 'Accounts Payable',
        accountType: 'Liabilities',
        description: 'Office supplies purchase - Staples',
        reference: 'PO-2024-001',
        debit: 0.00,
        credit: 450.00,
        runningBalance: 450.00,
        journalType: 'Purchase Journal'
      },
      
      // Cash Receipts
      {
        entryId: 'gl007',
        date: '2024-12-04',
        accountCode: '1010',
        accountName: 'Cash - Operating Account',
        accountType: 'Assets',
        description: 'Payment received from Client ABC',
        reference: 'CR-001',
        debit: 8500.00,
        credit: 0.00,
        runningBalance: 58500.00,
        journalType: 'Cash Receipts'
      },
      {
        entryId: 'gl008',
        date: '2024-12-04',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'Assets',
        description: 'Payment received from Client ABC',
        reference: 'CR-001',
        debit: 0.00,
        credit: 8500.00,
        runningBalance: 0.00,
        journalType: 'Cash Receipts'
      },
      
      // Operating Expenses
      {
        entryId: 'gl009',
        date: '2024-12-05',
        accountCode: '5020',
        accountName: 'Rent Expense',
        accountType: 'Expenses',
        description: 'Monthly office rent - December 2024',
        reference: 'RENT-DEC2024',
        debit: 3200.00,
        credit: 0.00,
        runningBalance: 3200.00,
        journalType: 'Cash Disbursements'
      },
      {
        entryId: 'gl010',
        date: '2024-12-05',
        accountCode: '1010',
        accountName: 'Cash - Operating Account',
        accountType: 'Assets',
        description: 'Monthly office rent - December 2024',
        reference: 'RENT-DEC2024',
        debit: 0.00,
        credit: 3200.00,
        runningBalance: 55300.00,
        journalType: 'Cash Disbursements'
      },
      
      // Payroll Entries
      {
        entryId: 'gl011',
        date: '2024-12-06',
        accountCode: '5030',
        accountName: 'Salaries and Wages Expense',
        accountType: 'Expenses',
        description: 'Payroll - First half December 2024',
        reference: 'PR-2024-23',
        debit: 12500.00,
        credit: 0.00,
        runningBalance: 12500.00,
        journalType: 'Payroll Journal'
      },
      {
        entryId: 'gl012',
        date: '2024-12-06',
        accountCode: '2020',
        accountName: 'Salaries Payable',
        accountType: 'Liabilities',
        description: 'Payroll - First half December 2024',
        reference: 'PR-2024-23',
        debit: 0.00,
        credit: 10000.00,
        runningBalance: 10000.00,
        journalType: 'Payroll Journal'
      },
      {
        entryId: 'gl013',
        date: '2024-12-06',
        accountCode: '2030',
        accountName: 'Payroll Tax Payable',
        accountType: 'Liabilities',
        description: 'Payroll taxes - First half December 2024',
        reference: 'PR-2024-23',
        debit: 0.00,
        credit: 2500.00,
        runningBalance: 2500.00,
        journalType: 'Payroll Journal'
      },
      
      // Equipment Purchase
      {
        entryId: 'gl014',
        date: '2024-12-07',
        accountCode: '1500',
        accountName: 'Equipment',
        accountType: 'Assets',
        description: 'Computer equipment purchase',
        reference: 'EQ-2024-001',
        debit: 5800.00,
        credit: 0.00,
        runningBalance: 5800.00,
        journalType: 'Purchase Journal'
      },
      {
        entryId: 'gl015',
        date: '2024-12-07',
        accountCode: '2010',
        accountName: 'Accounts Payable',
        accountType: 'Liabilities',
        description: 'Computer equipment purchase',
        reference: 'EQ-2024-001',
        debit: 0.00,
        credit: 5800.00,
        runningBalance: 6250.00,
        journalType: 'Purchase Journal'
      },
      
      // More Revenue Transactions
      {
        entryId: 'gl016',
        date: '2024-12-08',
        accountCode: '4010',
        accountName: 'Service Revenue',
        accountType: 'Revenue',
        description: 'Consulting services - Client DEF',
        reference: 'INV-2024-002',
        debit: 0.00,
        credit: 12000.00,
        runningBalance: 20500.00,
        journalType: 'Sales Journal'
      },
      {
        entryId: 'gl017',
        date: '2024-12-08',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'Assets',
        description: 'Consulting services - Client DEF',
        reference: 'INV-2024-002',
        debit: 12000.00,
        credit: 0.00,
        runningBalance: 12000.00,
        journalType: 'Sales Journal'
      },
      
      // Utility Expenses
      {
        entryId: 'gl018',
        date: '2024-12-09',
        accountCode: '5040',
        accountName: 'Utilities Expense',
        accountType: 'Expenses',
        description: 'Electric bill - November 2024',
        reference: 'UTIL-NOV2024',
        debit: 285.00,
        credit: 0.00,
        runningBalance: 285.00,
        journalType: 'Cash Disbursements'
      },
      {
        entryId: 'gl019',
        date: '2024-12-09',
        accountCode: '1010',
        accountName: 'Cash - Operating Account',
        accountType: 'Assets',
        description: 'Electric bill - November 2024',
        reference: 'UTIL-NOV2024',
        debit: 0.00,
        credit: 285.00,
        runningBalance: 55015.00,
        journalType: 'Cash Disbursements'
      },
      
      // Depreciation Adjustment
      {
        entryId: 'gl020',
        date: '2024-12-10',
        accountCode: '5050',
        accountName: 'Depreciation Expense',
        accountType: 'Expenses',
        description: 'Monthly depreciation - Equipment',
        reference: 'DEP-DEC2024',
        debit: 195.00,
        credit: 0.00,
        runningBalance: 195.00,
        journalType: 'General Journal'
      },
      {
        entryId: 'gl021',
        date: '2024-12-10',
        accountCode: '1510',
        accountName: 'Accumulated Depreciation - Equipment',
        accountType: 'Assets',
        description: 'Monthly depreciation - Equipment',
        reference: 'DEP-DEC2024',
        debit: 0.00,
        credit: 195.00,
        runningBalance: -195.00,
        journalType: 'General Journal'
      },
      
      // Additional Sales
      {
        entryId: 'gl022',
        date: '2024-12-11',
        accountCode: '4020',
        accountName: 'Product Sales',
        accountType: 'Revenue',
        description: 'Product sales - Various customers',
        reference: 'INV-2024-003',
        debit: 0.00,
        credit: 6750.00,
        runningBalance: 6750.00,
        journalType: 'Sales Journal'
      },
      {
        entryId: 'gl023',
        date: '2024-12-11',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'Assets',
        description: 'Product sales - Various customers',
        reference: 'INV-2024-003',
        debit: 6750.00,
        credit: 0.00,
        runningBalance: 18750.00,
        journalType: 'Sales Journal'
      },
      
      // Insurance Payment
      {
        entryId: 'gl024',
        date: '2024-12-12',
        accountCode: '5060',
        accountName: 'Insurance Expense',
        accountType: 'Expenses',
        description: 'Business insurance premium - Q4 2024',
        reference: 'INS-Q4-2024',
        debit: 1200.00,
        credit: 0.00,
        runningBalance: 1200.00,
        journalType: 'Cash Disbursements'
      },
      {
        entryId: 'gl025',
        date: '2024-12-12',
        accountCode: '1010',
        accountName: 'Cash - Operating Account',
        accountType: 'Assets',
        description: 'Business insurance premium - Q4 2024',
        reference: 'INS-Q4-2024',
        debit: 0.00,
        credit: 1200.00,
        runningBalance: 53815.00,
        journalType: 'Cash Disbursements'
      }
    ];

    // Apply filters
    let filteredEntries = entries;

    // Date filter
    filteredEntries = filteredEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });

    // Account type filter
    if (accountFilter !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.accountType === accountFilter);
    }

    // Journal type filter
    if (journalType !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.journalType === journalType);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter(entry =>
        entry.accountCode.toLowerCase().includes(searchLower) ||
        entry.accountName.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.reference.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date and then by entry ID
    filteredEntries.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.entryId.localeCompare(b.entryId);
    });

    // Calculate summary statistics
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const balanceDifference = totalDebits - totalCredits;
    const inBalance = Math.abs(balanceDifference) < 0.01; // Allow for small rounding differences

    // Get unique accounts
    const accountMap = new Map<string, AccountSummary>();
    
    filteredEntries.forEach(entry => {
      const key = entry.accountCode;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          accountType: entry.accountType,
          openingBalance: 0, // Simplified - in real system would track opening balances
          totalDebits: 0,
          totalCredits: 0,
          closingBalance: 0,
          entryCount: 0
        });
      }
      
      const account = accountMap.get(key)!;
      account.totalDebits += entry.debit;
      account.totalCredits += entry.credit;
      account.entryCount += 1;
      
      // Calculate closing balance based on account type
      if (account.accountType === 'Assets' || account.accountType === 'Expenses') {
        account.closingBalance = account.openingBalance + account.totalDebits - account.totalCredits;
      } else {
        account.closingBalance = account.openingBalance + account.totalCredits - account.totalDebits;
      }
    });

    const accountSummaries = Array.from(accountMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    // Calculate account type summaries
    const accountTypes = {
      assets: {
        accounts: accountSummaries.filter(a => a.accountType === 'Assets').length,
        balance: accountSummaries.filter(a => a.accountType === 'Assets').reduce((sum, a) => sum + a.closingBalance, 0)
      },
      liabilities: {
        accounts: accountSummaries.filter(a => a.accountType === 'Liabilities').length,
        balance: accountSummaries.filter(a => a.accountType === 'Liabilities').reduce((sum, a) => sum + a.closingBalance, 0)
      },
      equity: {
        accounts: accountSummaries.filter(a => a.accountType === 'Equity').length,
        balance: accountSummaries.filter(a => a.accountType === 'Equity').reduce((sum, a) => sum + a.closingBalance, 0)
      },
      revenue: {
        accounts: accountSummaries.filter(a => a.accountType === 'Revenue').length,
        balance: accountSummaries.filter(a => a.accountType === 'Revenue').reduce((sum, a) => sum + a.closingBalance, 0)
      },
      expenses: {
        accounts: accountSummaries.filter(a => a.accountType === 'Expenses').length,
        balance: accountSummaries.filter(a => a.accountType === 'Expenses').reduce((sum, a) => sum + a.closingBalance, 0)
      }
    };

    const response = {
      reportPeriod: {
        startDate,
        endDate
      },
      summary: {
        totalAccounts: accountSummaries.length,
        totalDebits,
        totalCredits,
        totalEntries: filteredEntries.length,
        balanceDifference,
        inBalance
      },
      entries: filteredEntries,
      accountSummaries,
      accountTypes
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('General ledger report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate general ledger report' },
      { status: 500 }
    );
  }
}
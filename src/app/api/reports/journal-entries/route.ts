import { NextRequest, NextResponse } from 'next/server';

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  description: string;
  type: 'Manual' | 'System' | 'Adjustment' | 'Closing';
  status: 'Draft' | 'Posted' | 'Reversed';
  createdBy: string;
  totalDebit: number;
  totalCredit: number;
  lineItems: Array<{
    id: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

// Sample journal entries data
const sampleEntries: JournalEntry[] = [
  {
    id: '1',
    entryNumber: 'JE-2024-001',
    date: '2024-12-01',
    reference: 'INV-2024-101',
    description: 'Sale to Boston Medical Center - Medical Equipment',
    type: 'System',
    status: 'Posted',
    createdBy: 'John Smith',
    totalDebit: 15750.00,
    totalCredit: 15750.00,
    lineItems: [
      {
        id: 'l1',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        description: 'Sale to Boston Medical Center',
        debit: 15750.00,
        credit: 0,
      },
      {
        id: 'l2',
        accountCode: '4100',
        accountName: 'Sales Revenue',
        description: 'Medical Equipment Sales',
        debit: 0,
        credit: 13500.00,
      },
      {
        id: 'l3',
        accountCode: '2200',
        accountName: 'Sales Tax Payable',
        description: 'MA Sales Tax 6.25%',
        debit: 0,
        credit: 843.75,
      },
      {
        id: 'l4',
        accountCode: '2210',
        accountName: 'Local Tax Payable',
        description: 'Local Sales Tax 3%',
        debit: 0,
        credit: 405.00,
      },
      {
        id: 'l5',
        accountCode: '2220',
        accountName: 'Medical Device Tax',
        description: 'Federal Medical Device Tax',
        debit: 0,
        credit: 1001.25,
      }
    ]
  },
  {
    id: '2',
    entryNumber: 'JE-2024-002',
    date: '2024-12-02',
    reference: 'PAY-2024-055',
    description: 'Payment received from Boston Medical Center',
    type: 'System',
    status: 'Posted',
    createdBy: 'Sarah Johnson',
    totalDebit: 15750.00,
    totalCredit: 15750.00,
    lineItems: [
      {
        id: 'l6',
        accountCode: '1000',
        accountName: 'Cash - Operating Account',
        description: 'Payment received via ACH',
        debit: 15750.00,
        credit: 0,
      },
      {
        id: 'l7',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        description: 'Payment from Boston Medical Center',
        debit: 0,
        credit: 15750.00,
      }
    ]
  },
  {
    id: '3',
    entryNumber: 'JE-2024-003',
    date: '2024-12-03',
    reference: 'BILL-2024-089',
    description: 'Purchase of medical supplies from MedSupply Corp',
    type: 'System',
    status: 'Posted',
    createdBy: 'Michael Chen',
    totalDebit: 8450.00,
    totalCredit: 8450.00,
    lineItems: [
      {
        id: 'l8',
        accountCode: '1300',
        accountName: 'Inventory - Medical Supplies',
        description: 'Surgical instruments and supplies',
        debit: 7500.00,
        credit: 0,
      },
      {
        id: 'l9',
        accountCode: '1400',
        accountName: 'Prepaid Insurance',
        description: 'Shipping insurance premium',
        debit: 125.00,
        credit: 0,
      },
      {
        id: 'l10',
        accountCode: '5100',
        accountName: 'Freight & Shipping',
        description: 'Express delivery charges',
        debit: 825.00,
        credit: 0,
      },
      {
        id: 'l11',
        accountCode: '2000',
        accountName: 'Accounts Payable',
        description: 'Amount owed to MedSupply Corp',
        debit: 0,
        credit: 8450.00,
      }
    ]
  },
  {
    id: '4',
    entryNumber: 'JE-2024-004',
    date: '2024-12-04',
    reference: 'ADJ-2024-012',
    description: 'Inventory adjustment - damaged goods write-off',
    type: 'Adjustment',
    status: 'Posted',
    createdBy: 'Lisa Rodriguez',
    totalDebit: 1250.00,
    totalCredit: 1250.00,
    lineItems: [
      {
        id: 'l12',
        accountCode: '5500',
        accountName: 'Loss on Damaged Inventory',
        description: 'Write-off damaged surgical tools',
        debit: 1250.00,
        credit: 0,
      },
      {
        id: 'l13',
        accountCode: '1300',
        accountName: 'Inventory - Medical Supplies',
        description: 'Remove damaged inventory',
        debit: 0,
        credit: 1250.00,
      }
    ]
  },
  {
    id: '5',
    entryNumber: 'JE-2024-005',
    date: '2024-12-05',
    reference: 'PAY-2024-056',
    description: 'Monthly rent payment for facility',
    type: 'Manual',
    status: 'Posted',
    createdBy: 'David Kim',
    totalDebit: 12000.00,
    totalCredit: 12000.00,
    lineItems: [
      {
        id: 'l14',
        accountCode: '5200',
        accountName: 'Rent Expense',
        description: 'December facility rent',
        debit: 12000.00,
        credit: 0,
      },
      {
        id: 'l15',
        accountCode: '1000',
        accountName: 'Cash - Operating Account',
        description: 'Rent payment via check #2458',
        debit: 0,
        credit: 12000.00,
      }
    ]
  },
  {
    id: '6',
    entryNumber: 'JE-2024-006',
    date: '2024-12-06',
    reference: 'PAYROLL-2024-24',
    description: 'Bi-weekly payroll processing',
    type: 'System',
    status: 'Posted',
    createdBy: 'HR System',
    totalDebit: 45600.00,
    totalCredit: 45600.00,
    lineItems: [
      {
        id: 'l16',
        accountCode: '5300',
        accountName: 'Salaries & Wages',
        description: 'Gross wages for pay period',
        debit: 38000.00,
        credit: 0,
      },
      {
        id: 'l17',
        accountCode: '5310',
        accountName: 'Payroll Tax Expense',
        description: 'Employer FICA and FUTA taxes',
        debit: 4200.00,
        credit: 0,
      },
      {
        id: 'l18',
        accountCode: '5320',
        accountName: 'Benefits Expense',
        description: 'Health insurance and 401k match',
        debit: 3400.00,
        credit: 0,
      },
      {
        id: 'l19',
        accountCode: '2100',
        accountName: 'Wages Payable',
        description: 'Net pay owed to employees',
        debit: 0,
        credit: 28500.00,
      },
      {
        id: 'l20',
        accountCode: '2110',
        accountName: 'Federal Tax Withholding',
        description: 'Employee federal income tax',
        debit: 0,
        credit: 5700.00,
      },
      {
        id: 'l21',
        accountCode: '2120',
        accountName: 'State Tax Withholding',
        description: 'Employee state income tax',
        debit: 0,
        credit: 1900.00,
      },
      {
        id: 'l22',
        accountCode: '2130',
        accountName: 'FICA Payable',
        description: 'Employee and employer FICA',
        debit: 0,
        credit: 5814.00,
      },
      {
        id: 'l23',
        accountCode: '2140',
        accountName: 'Benefits Payable',
        description: 'Employee benefit deductions',
        debit: 0,
        credit: 3686.00,
      }
    ]
  },
  {
    id: '7',
    entryNumber: 'JE-2024-007',
    date: '2024-12-07',
    reference: 'INV-2024-102',
    description: 'Sale to Cambridge Hospital - Diagnostic Equipment',
    type: 'System',
    status: 'Draft',
    createdBy: 'Emily Davis',
    totalDebit: 23400.00,
    totalCredit: 23400.00,
    lineItems: [
      {
        id: 'l24',
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        description: 'Sale to Cambridge Hospital',
        debit: 23400.00,
        credit: 0,
      },
      {
        id: 'l25',
        accountCode: '4100',
        accountName: 'Sales Revenue',
        description: 'Diagnostic Equipment Sales',
        debit: 0,
        credit: 20000.00,
      },
      {
        id: 'l26',
        accountCode: '2200',
        accountName: 'Sales Tax Payable',
        description: 'MA Sales Tax 6.25%',
        debit: 0,
        credit: 1250.00,
      },
      {
        id: 'l27',
        accountCode: '2210',
        accountName: 'Local Tax Payable',
        description: 'Local Sales Tax 3%',
        debit: 0,
        credit: 600.00,
      },
      {
        id: 'l28',
        accountCode: '2220',
        accountName: 'Medical Device Tax',
        description: 'Federal Medical Device Tax',
        debit: 0,
        credit: 1550.00,
      }
    ]
  },
  {
    id: '8',
    entryNumber: 'JE-2024-008',
    date: '2024-12-08',
    reference: 'DEP-2024-033',
    description: 'Monthly depreciation of medical equipment',
    type: 'Adjustment',
    status: 'Posted',
    createdBy: 'Robert Wilson',
    totalDebit: 8750.00,
    totalCredit: 8750.00,
    lineItems: [
      {
        id: 'l29',
        accountCode: '5400',
        accountName: 'Depreciation Expense',
        description: 'Monthly equipment depreciation',
        debit: 8750.00,
        credit: 0,
      },
      {
        id: 'l30',
        accountCode: '1510',
        accountName: 'Accumulated Depreciation - Equipment',
        description: 'Accumulated depreciation on equipment',
        debit: 0,
        credit: 8750.00,
      }
    ]
  },
  {
    id: '9',
    entryNumber: 'JE-2024-009',
    date: '2024-12-09',
    reference: 'UTIL-2024-012',
    description: 'Monthly utility expenses',
    type: 'Manual',
    status: 'Posted',
    createdBy: 'Jennifer Brown',
    totalDebit: 3450.00,
    totalCredit: 3450.00,
    lineItems: [
      {
        id: 'l31',
        accountCode: '5250',
        accountName: 'Electricity Expense',
        description: 'December electricity bill',
        debit: 1850.00,
        credit: 0,
      },
      {
        id: 'l32',
        accountCode: '5260',
        accountName: 'Gas Expense',
        description: 'December heating gas',
        debit: 750.00,
        credit: 0,
      },
      {
        id: 'l33',
        accountCode: '5270',
        accountName: 'Water & Sewer',
        description: 'December water and sewer',
        debit: 425.00,
        credit: 0,
      },
      {
        id: 'l34',
        accountCode: '5280',
        accountName: 'Internet & Phone',
        description: 'December telecommunications',
        debit: 425.00,
        credit: 0,
      },
      {
        id: 'l35',
        accountCode: '2000',
        accountName: 'Accounts Payable',
        description: 'Utility bills payable',
        debit: 0,
        credit: 3450.00,
      }
    ]
  },
  {
    id: '10',
    entryNumber: 'JE-2024-010',
    date: '2024-12-10',
    reference: 'INT-2024-008',
    description: 'Interest income on business savings account',
    type: 'System',
    status: 'Posted',
    createdBy: 'Banking System',
    totalDebit: 875.00,
    totalCredit: 875.00,
    lineItems: [
      {
        id: 'l36',
        accountCode: '1010',
        accountName: 'Cash - Savings Account',
        description: 'Interest earned on savings',
        debit: 875.00,
        credit: 0,
      },
      {
        id: 'l37',
        accountCode: '4200',
        accountName: 'Interest Income',
        description: 'Monthly interest on savings account',
        debit: 0,
        credit: 875.00,
      }
    ]
  },
  {
    id: '11',
    entryNumber: 'JE-2024-011',
    date: '2024-12-11',
    reference: 'REV-2024-003',
    description: 'Reversal of incorrect inventory entry',
    type: 'Adjustment',
    status: 'Reversed',
    createdBy: 'Amanda Taylor',
    totalDebit: 2500.00,
    totalCredit: 2500.00,
    lineItems: [
      {
        id: 'l38',
        accountCode: '1300',
        accountName: 'Inventory - Medical Supplies',
        description: 'Reverse incorrect inventory booking',
        debit: 2500.00,
        credit: 0,
      },
      {
        id: 'l39',
        accountCode: '5100',
        accountName: 'Cost of Goods Sold',
        description: 'Reverse COGS entry',
        debit: 0,
        credit: 2500.00,
      }
    ]
  },
  {
    id: '12',
    entryNumber: 'JE-2024-012',
    date: '2024-12-12',
    reference: 'LOAN-2024-004',
    description: 'Monthly payment on equipment loan',
    type: 'Manual',
    status: 'Posted',
    createdBy: 'Thomas Anderson',
    totalDebit: 5200.00,
    totalCredit: 5200.00,
    lineItems: [
      {
        id: 'l40',
        accountCode: '2500',
        accountName: 'Equipment Loan Payable',
        description: 'Principal payment on loan',
        debit: 4100.00,
        credit: 0,
      },
      {
        id: 'l41',
        accountCode: '5600',
        accountName: 'Interest Expense',
        description: 'Interest portion of loan payment',
        debit: 1100.00,
        credit: 0,
      },
      {
        id: 'l42',
        accountCode: '1000',
        accountName: 'Cash - Operating Account',
        description: 'Loan payment via ACH',
        debit: 0,
        credit: 5200.00,
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-12-01';
    const endDate = searchParams.get('endDate') || '2024-12-31';
    const entryType = searchParams.get('entryType') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Filter entries based on parameters
    let filteredEntries = sampleEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const dateInRange = entryDate >= start && entryDate <= end;
      const typeMatch = entryType === 'all' || entry.type === entryType;
      const statusMatch = status === 'all' || entry.status === status;
      const searchMatch = search === '' || 
        entry.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
        entry.reference.toLowerCase().includes(search.toLowerCase()) ||
        entry.description.toLowerCase().includes(search.toLowerCase());

      return dateInRange && typeMatch && statusMatch && searchMatch;
    });

    // Sort by date (most recent first)
    filteredEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary statistics
    const totalEntries = filteredEntries.length;
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.totalDebit, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.totalCredit, 0);
    
    const draftEntries = filteredEntries.filter(e => e.status === 'Draft').length;
    const postedEntries = filteredEntries.filter(e => e.status === 'Posted').length;
    const reversedEntries = filteredEntries.filter(e => e.status === 'Reversed').length;

    // Calculate entry type breakdown
    const entryTypes = {
      manual: {
        count: filteredEntries.filter(e => e.type === 'Manual').length,
        amount: filteredEntries.filter(e => e.type === 'Manual').reduce((sum, e) => sum + e.totalDebit, 0)
      },
      system: {
        count: filteredEntries.filter(e => e.type === 'System').length,
        amount: filteredEntries.filter(e => e.type === 'System').reduce((sum, e) => sum + e.totalDebit, 0)
      },
      adjustment: {
        count: filteredEntries.filter(e => e.type === 'Adjustment').length,
        amount: filteredEntries.filter(e => e.type === 'Adjustment').reduce((sum, e) => sum + e.totalDebit, 0)
      },
      closing: {
        count: filteredEntries.filter(e => e.type === 'Closing').length,
        amount: filteredEntries.filter(e => e.type === 'Closing').reduce((sum, e) => sum + e.totalDebit, 0)
      }
    };

    const responseData = {
      reportPeriod: {
        startDate,
        endDate,
      },
      summary: {
        totalEntries,
        totalDebits,
        totalCredits,
        draftEntries,
        postedEntries,
        reversedEntries,
      },
      entries: filteredEntries,
      entryTypes,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in journal entries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}
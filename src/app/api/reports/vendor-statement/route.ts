import { NextRequest, NextResponse } from 'next/server';

// Sample vendor data - in a real app, this would come from your database
const vendors = {
  vendor1: {
    id: 'vendor1',
    name: 'ABC Supply Co.',
    address: '123 Industrial Blvd, Boston, MA 02101',
    phone: '(617) 555-0123',
    email: 'orders@abcsupply.com'
  },
  vendor2: {
    id: 'vendor2',
    name: 'Office Depot',
    address: '456 Commerce St, Cambridge, MA 02139',
    phone: '(617) 555-0456',
    email: 'business@officedepot.com'
  },
  vendor3: {
    id: 'vendor3',
    name: 'Tech Solutions Inc.',
    address: '789 Tech Park Dr, Waltham, MA 02451',
    phone: '(781) 555-0789',
    email: 'support@techsolutions.com'
  }
};

// Sample transaction data
const generateSampleTransactions = (vendorId: string, startDate: string, endDate: string) => {
  const transactions = [
    {
      id: '1',
      date: '2025-12-01',
      type: 'Bill' as const,
      reference: 'INV-2025-001',
      description: 'Office supplies for Q4 operations',
      amount: 1250.00,
      balance: 1250.00
    },
    {
      id: '2',
      date: '2025-12-05',
      type: 'Payment' as const,
      reference: 'PMT-001',
      description: 'Payment on account',
      amount: -500.00,
      balance: 750.00
    },
    {
      id: '3',
      date: '2025-12-08',
      type: 'Bill' as const,
      reference: 'INV-2025-002',
      description: 'Computer equipment purchase',
      amount: 2100.00,
      balance: 2850.00
    },
    {
      id: '4',
      date: '2025-12-10',
      type: 'Credit' as const,
      reference: 'CR-001',
      description: 'Return defective items',
      amount: -150.00,
      balance: 2700.00
    },
    {
      id: '5',
      date: '2025-12-12',
      type: 'Payment' as const,
      reference: 'PMT-002',
      description: 'Payment on account',
      amount: -1000.00,
      balance: 1700.00
    }
  ];

  // Filter transactions by date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return transactions.filter(transaction => {
    const transDate = new Date(transaction.date);
    return transDate >= start && transDate <= end;
  });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!vendorId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const vendor = vendors[vendorId as keyof typeof vendors];
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const transactions = generateSampleTransactions(vendorId, startDate, endDate);
    
    // Calculate summary
    const beginningBalance = 0; // In real app, get from previous period
    const totalPurchases = transactions
      .filter(t => t.type === 'Bill')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = Math.abs(transactions
      .filter(t => t.type === 'Payment')
      .reduce((sum, t) => sum + t.amount, 0));
    const totalAdjustments = transactions
      .filter(t => t.type === 'Credit' || t.type === 'Adjustment')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const endingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : beginningBalance;

    // Calculate aging (sample data)
    const aging = {
      current: endingBalance * 0.6,
      days1to30: endingBalance * 0.2,
      days31to60: endingBalance * 0.1,
      days61to90: endingBalance * 0.07,
      over90: endingBalance * 0.03
    };

    const statementData = {
      vendor,
      statementPeriod: {
        startDate,
        endDate
      },
      summary: {
        beginningBalance,
        totalPurchases,
        totalPayments,
        totalAdjustments,
        endingBalance
      },
      transactions,
      aging
    };

    return NextResponse.json(statementData);
  } catch (error) {
    console.error('Error generating vendor statement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
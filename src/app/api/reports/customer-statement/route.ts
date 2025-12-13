import { NextRequest, NextResponse } from 'next/server';

interface CustomerTransaction {
  id: string;
  date: string;
  type: 'Invoice' | 'Payment' | 'Credit' | 'Adjustment';
  reference: string;
  description: string;
  amount: number;
  balance: number;
}

interface CustomerData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

interface CustomerStatementData {
  customer: CustomerData;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    beginningBalance: number;
    totalInvoiced: number;
    totalPayments: number;
    totalAdjustments: number;
    endingBalance: number;
  };
  transactions: CustomerTransaction[];
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
}

// Sample customer data
const customers: Record<string, CustomerData> = {
  customer1: {
    id: 'customer1',
    name: 'Acme Corporation',
    address: '123 Business Blvd, Boston, MA 02101',
    phone: '(617) 555-0100',
    email: 'accounting@acmecorp.com'
  },
  customer2: {
    id: 'customer2',
    name: 'Global Industries Ltd.',
    address: '456 Commerce Dr, Cambridge, MA 02139',
    phone: '(617) 555-0200',
    email: 'finance@globalindustries.com'
  },
  customer3: {
    id: 'customer3',
    name: 'Metro Business Solutions',
    address: '789 Enterprise Way, Somerville, MA 02143',
    phone: '(617) 555-0300',
    email: 'billing@metrobiz.com'
  }
};

// Generate sample transactions for a customer
function generateCustomerTransactions(customerId: string, startDate: string, endDate: string): CustomerTransaction[] {
  const transactions: CustomerTransaction[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentBalance = 0;
  let transactionId = 1;

  // Generate beginning balance
  const beginningBalance = Math.random() * 5000 + 1000;
  currentBalance = beginningBalance;

  // Add beginning balance transaction
  transactions.push({
    id: `txn-${transactionId++}`,
    date: start.toISOString(),
    type: 'Adjustment',
    reference: 'OPENING',
    description: 'Opening Balance',
    amount: beginningBalance,
    balance: currentBalance
  });

  // Generate random transactions throughout the period
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const numTransactions = Math.floor(Math.random() * 15) + 10; // 10-24 transactions

  for (let i = 0; i < numTransactions; i++) {
    const randomDays = Math.floor(Math.random() * daysDiff);
    const transactionDate = new Date(start.getTime() + randomDays * 24 * 60 * 60 * 1000);
    
    // Determine transaction type
    const rand = Math.random();
    let type: 'Invoice' | 'Payment' | 'Credit' | 'Adjustment';
    let amount: number;
    let description: string;
    let reference: string;

    if (rand < 0.5) {
      // Invoice (positive amount - increases balance)
      type = 'Invoice';
      amount = Math.floor(Math.random() * 3000) + 500;
      description = `Professional services - ${transactionDate.toLocaleDateString()}`;
      reference = `INV-${String(1000 + i).padStart(4, '0')}`;
    } else if (rand < 0.85) {
      // Payment (negative amount - decreases balance)
      type = 'Payment';
      amount = -(Math.floor(Math.random() * 2000) + 300);
      description = 'Payment received - Thank you';
      reference = `PMT-${String(2000 + i).padStart(4, '0')}`;
    } else if (rand < 0.95) {
      // Credit (negative amount - decreases balance)
      type = 'Credit';
      amount = -(Math.floor(Math.random() * 500) + 50);
      description = 'Credit memo - Service adjustment';
      reference = `CM-${String(3000 + i).padStart(4, '0')}`;
    } else {
      // Adjustment (can be positive or negative)
      type = 'Adjustment';
      amount = (Math.random() - 0.5) * 200; // -100 to +100
      description = 'Account adjustment';
      reference = `ADJ-${String(4000 + i).padStart(4, '0')}`;
    }

    currentBalance += amount;

    transactions.push({
      id: `txn-${transactionId++}`,
      date: transactionDate.toISOString(),
      type,
      reference,
      description,
      amount,
      balance: currentBalance
    });
  }

  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recalculate running balances
  let runningBalance = beginningBalance;
  for (let i = 1; i < transactions.length; i++) {
    runningBalance += transactions[i].amount;
    transactions[i].balance = runningBalance;
  }

  return transactions;
}

// Calculate aging buckets
function calculateAging(transactions: CustomerTransaction[], endDate: string) {
  const end = new Date(endDate);
  const aging = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0
  };

  // Get unpaid invoices
  const unpaidInvoices = transactions.filter(t => t.type === 'Invoice' && t.amount > 0);

  unpaidInvoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.date);
    const daysDiff = Math.ceil((end.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For simplicity, assume partial payments reduce the oldest invoices first
    // In a real system, you'd track which specific invoices are paid
    const remainingAmount = invoice.amount * (Math.random() * 0.8 + 0.2); // 20-100% remains unpaid

    if (daysDiff <= 0) {
      aging.current += remainingAmount;
    } else if (daysDiff <= 30) {
      aging.days1to30 += remainingAmount;
    } else if (daysDiff <= 60) {
      aging.days31to60 += remainingAmount;
    } else if (daysDiff <= 90) {
      aging.days61to90 += remainingAmount;
    } else {
      aging.over90 += remainingAmount;
    }
  });

  return aging;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'customerId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const customer = customers[customerId];
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Generate sample data
    const transactions = generateCustomerTransactions(customerId, startDate, endDate);
    const aging = calculateAging(transactions, endDate);

    // Calculate summary
    const beginningBalance = transactions.length > 0 ? transactions[0].amount : 0;
    const endingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    
    const invoices = transactions.filter(t => t.type === 'Invoice');
    const payments = transactions.filter(t => t.type === 'Payment');
    const adjustments = transactions.filter(t => t.type === 'Adjustment' || t.type === 'Credit');

    const totalInvoiced = invoices.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalPayments = Math.abs(payments.reduce((sum, t) => sum + t.amount, 0));
    const totalAdjustments = adjustments.slice(1).reduce((sum, t) => sum + t.amount, 0); // Exclude opening balance

    const statementData: CustomerStatementData = {
      customer,
      statementPeriod: {
        startDate,
        endDate
      },
      summary: {
        beginningBalance,
        totalInvoiced,
        totalPayments,
        totalAdjustments,
        endingBalance
      },
      transactions,
      aging
    };

    return NextResponse.json(statementData);
  } catch (error) {
    console.error('Error generating customer statement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
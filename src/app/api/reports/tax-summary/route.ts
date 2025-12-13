import { NextRequest, NextResponse } from 'next/server';

interface TaxDeduction {
  category: string;
  description: string;
  amount: number;
  deductible: boolean;
}

interface QuarterlyTax {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  period: string;
  estimatedPayment: number;
  actualPayment: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface TaxSummaryData {
  reportPeriod: {
    taxYear: number;
    startDate: string;
    endDate: string;
  };
  income: {
    grossRevenue: number;
    netIncome: number;
    operatingIncome: number;
    otherIncome: number;
    totalTaxableIncome: number;
  };
  deductions: {
    totalDeductions: number;
    businessExpenses: number;
    depreciation: number;
    interestExpenses: number;
    otherDeductions: number;
    itemizedDeductions: TaxDeduction[];
  };
  taxCalculations: {
    taxableIncome: number;
    federalTaxRate: number;
    federalTaxLiability: number;
    stateTaxRate: number;
    stateTaxLiability: number;
    selfEmploymentTax: number;
    totalTaxLiability: number;
    effectiveTaxRate: number;
  };
  payments: {
    quarterlyPayments: QuarterlyTax[];
    totalPaid: number;
    withheld: number;
    refundDue: number;
    balanceDue: number;
  };
  compliance: {
    filingStatus: 'Corporation' | 'Partnership' | 'LLC' | 'Sole Proprietorship';
    ein: string;
    filingDeadline: string;
    extensionFiled: boolean;
    extensionDeadline?: string;
    estimatedPenalty: number;
  };
}

// Generate realistic tax data for Sceneside L.L.C (medical company)
const generateTaxData = (taxYear: number): TaxSummaryData => {
  // Base financial data for medical services company
  const grossRevenue = 8540000;
  const operatingExpenses = 6420000;
  const operatingIncome = grossRevenue - operatingExpenses;
  const otherIncome = 45000; // Interest income
  const netIncome = operatingIncome + otherIncome;

  // Deductions breakdown
  const businessExpenses = 4850000;
  const depreciation = 320000;
  const interestExpenses = 185000;
  const otherDeductions = 125000;
  const totalDeductions = businessExpenses + depreciation + interestExpenses + otherDeductions;

  // Tax calculations
  const taxableIncome = netIncome - totalDeductions;
  const federalTaxRate = 0.21; // Corporate tax rate
  const stateTaxRate = 0.063; // Massachusetts corporate tax rate
  const federalTaxLiability = taxableIncome * federalTaxRate;
  const stateTaxLiability = taxableIncome * stateTaxRate;
  const selfEmploymentTax = netIncome * 0.153; // 15.3% SE tax rate
  const totalTaxLiability = federalTaxLiability + stateTaxLiability + selfEmploymentTax;
  const effectiveTaxRate = totalTaxLiability / netIncome;

  // Quarterly payments
  const quarterlyEstimate = totalTaxLiability / 4;
  const quarterlyPayments: QuarterlyTax[] = [
    {
      quarter: 'Q1',
      period: `Jan - Mar ${taxYear}`,
      estimatedPayment: quarterlyEstimate,
      actualPayment: quarterlyEstimate * 1.02,
      dueDate: `${taxYear}-04-15`,
      status: 'Paid'
    },
    {
      quarter: 'Q2',
      period: `Apr - Jun ${taxYear}`,
      estimatedPayment: quarterlyEstimate,
      actualPayment: quarterlyEstimate * 0.98,
      dueDate: `${taxYear}-06-15`,
      status: 'Paid'
    },
    {
      quarter: 'Q3',
      period: `Jul - Sep ${taxYear}`,
      estimatedPayment: quarterlyEstimate,
      actualPayment: quarterlyEstimate * 1.01,
      dueDate: `${taxYear}-09-15`,
      status: taxYear === new Date().getFullYear() ? 'Pending' : 'Paid'
    },
    {
      quarter: 'Q4',
      period: `Oct - Dec ${taxYear}`,
      estimatedPayment: quarterlyEstimate,
      actualPayment: taxYear === new Date().getFullYear() ? 0 : quarterlyEstimate * 0.97,
      dueDate: `${taxYear + 1}-01-15`,
      status: taxYear === new Date().getFullYear() ? 'Pending' : 'Paid'
    }
  ];

  const totalPaid = quarterlyPayments.reduce((sum, q) => sum + q.actualPayment, 0);
  const balanceDue = totalTaxLiability - totalPaid;

  // Itemized deductions for medical services company
  const itemizedDeductions: TaxDeduction[] = [
    {
      category: 'Medical Equipment',
      description: 'MRI Machine depreciation and maintenance',
      amount: 185000,
      deductible: true
    },
    {
      category: 'Professional Services',
      description: 'Legal and accounting fees',
      amount: 125000,
      deductible: true
    },
    {
      category: 'Medical Supplies',
      description: 'Surgical instruments, disposables, pharmaceuticals',
      amount: 890000,
      deductible: true
    },
    {
      category: 'Staff Salaries',
      description: 'Medical staff and administrative salaries',
      amount: 2850000,
      deductible: true
    },
    {
      category: 'Facility Costs',
      description: 'Rent, utilities, and facility maintenance',
      amount: 420000,
      deductible: true
    },
    {
      category: 'Insurance',
      description: 'Malpractice, property, and general liability insurance',
      amount: 285000,
      deductible: true
    },
    {
      category: 'Technology',
      description: 'EMR systems, computers, and software licenses',
      amount: 95000,
      deductible: true
    },
    {
      category: 'Training & Education',
      description: 'Medical education and staff training programs',
      amount: 45000,
      deductible: true
    },
    {
      category: 'Vehicle Expenses',
      description: 'Ambulance and company vehicle expenses',
      amount: 65000,
      deductible: true
    },
    {
      category: 'Research & Development',
      description: 'Medical research and equipment testing',
      amount: 85000,
      deductible: true
    },
    {
      category: 'Marketing',
      description: 'Healthcare marketing and patient outreach',
      amount: 35000,
      deductible: true
    },
    {
      category: 'Meals & Entertainment',
      description: 'Business meals with medical partners',
      amount: 18000,
      deductible: false // Only 50% deductible, showing as non-deductible for simplicity
    }
  ];

  return {
    reportPeriod: {
      taxYear,
      startDate: `${taxYear}-01-01`,
      endDate: `${taxYear}-12-31`
    },
    income: {
      grossRevenue,
      netIncome,
      operatingIncome,
      otherIncome,
      totalTaxableIncome: netIncome
    },
    deductions: {
      totalDeductions,
      businessExpenses,
      depreciation,
      interestExpenses,
      otherDeductions,
      itemizedDeductions
    },
    taxCalculations: {
      taxableIncome,
      federalTaxRate,
      federalTaxLiability,
      stateTaxRate,
      stateTaxLiability,
      selfEmploymentTax,
      totalTaxLiability,
      effectiveTaxRate
    },
    payments: {
      quarterlyPayments,
      totalPaid,
      withheld: 0,
      refundDue: balanceDue < 0 ? Math.abs(balanceDue) : 0,
      balanceDue: balanceDue > 0 ? balanceDue : 0
    },
    compliance: {
      filingStatus: 'LLC',
      ein: '12-3456789',
      filingDeadline: `${taxYear + 1}-03-15`,
      extensionFiled: false,
      estimatedPenalty: balanceDue > 1000 ? balanceDue * 0.02 : 0
    }
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taxYear = parseInt(searchParams.get('taxYear') || new Date().getFullYear().toString());

    // Validate tax year
    const currentYear = new Date().getFullYear();
    if (taxYear < currentYear - 10 || taxYear > currentYear + 1) {
      return NextResponse.json({ error: 'Invalid tax year' }, { status: 400 });
    }

    const taxData = generateTaxData(taxYear);

    return NextResponse.json(taxData);
  } catch (error) {
    console.error('Tax summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
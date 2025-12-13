import { NextRequest, NextResponse } from 'next/server';

interface CustomerSale {
  customerId: string;
  customerName: string;
  customerType: 'Individual' | 'Business' | 'Government';
  totalSales: number;
  invoiceCount: number;
  averageSale: number;
  firstSaleDate: string;
  lastSaleDate: string;
  salesGrowth: number;
  topProducts: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
}

interface SalesByCustomerData {
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCustomers: number;
    totalSales: number;
    averageSalePerCustomer: number;
    topCustomerRevenue: number;
    topCustomerName: string;
    newCustomers: number;
    returningCustomers: number;
  };
  customers: CustomerSale[];
  topCustomers: CustomerSale[];
  customerTypes: {
    individual: { count: number; revenue: number };
    business: { count: number; revenue: number };
    government: { count: number; revenue: number };
  };
}

// Sample customer database
const customerDatabase = [
  { id: 'cust001', name: 'Acme Corporation', type: 'Business' as const },
  { id: 'cust002', name: 'Global Industries Ltd.', type: 'Business' as const },
  { id: 'cust003', name: 'Metro Business Solutions', type: 'Business' as const },
  { id: 'cust004', name: 'TechStart Inc.', type: 'Business' as const },
  { id: 'cust005', name: 'DataFlow Systems', type: 'Business' as const },
  { id: 'cust006', name: 'City of Boston', type: 'Government' as const },
  { id: 'cust007', name: 'Massachusetts DOT', type: 'Government' as const },
  { id: 'cust008', name: 'Federal Building Services', type: 'Government' as const },
  { id: 'cust009', name: 'John Smith', type: 'Individual' as const },
  { id: 'cust010', name: 'Sarah Johnson', type: 'Individual' as const },
  { id: 'cust011', name: 'Michael Brown', type: 'Individual' as const },
  { id: 'cust012', name: 'Emily Davis', type: 'Individual' as const },
  { id: 'cust013', name: 'CloudTech Solutions', type: 'Business' as const },
  { id: 'cust014', name: 'Innovation Labs', type: 'Business' as const },
  { id: 'cust015', name: 'David Wilson', type: 'Individual' as const },
  { id: 'cust016', name: 'Smart Systems Corp', type: 'Business' as const },
  { id: 'cust017', name: 'Regional Transit Authority', type: 'Government' as const },
  { id: 'cust018', name: 'Lisa Anderson', type: 'Individual' as const },
  { id: 'cust019', name: 'NextGen Technologies', type: 'Business' as const },
  { id: 'cust020', name: 'Robert Miller', type: 'Individual' as const }
];

const productList = [
  'Professional Consulting',
  'Software License',
  'Technical Support',
  'Training Services',
  'Implementation Services',
  'Maintenance Contract',
  'System Integration',
  'Custom Development',
  'Data Analysis',
  'Project Management',
  'Security Assessment',
  'Performance Optimization',
  'Cloud Migration',
  'Digital Transformation',
  'IT Infrastructure'
];

// Generate random sales data for a customer
function generateCustomerSales(
  customer: typeof customerDatabase[0],
  startDate: string,
  endDate: string
): CustomerSale {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate number of invoices based on customer type
  let baseInvoiceCount: number;
  let baseRevenue: number;
  
  switch (customer.type) {
    case 'Business':
      baseInvoiceCount = Math.floor(Math.random() * 20) + 15; // 15-34 invoices
      baseRevenue = Math.random() * 300000 + 100000; // $100k-$400k
      break;
    case 'Government':
      baseInvoiceCount = Math.floor(Math.random() * 10) + 5; // 5-14 invoices
      baseRevenue = Math.random() * 500000 + 200000; // $200k-$700k
      break;
    case 'Individual':
      baseInvoiceCount = Math.floor(Math.random() * 8) + 2; // 2-9 invoices
      baseRevenue = Math.random() * 25000 + 5000; // $5k-$30k
      break;
    default:
      baseInvoiceCount = 5;
      baseRevenue = 50000;
  }

  const totalSales = Math.round(baseRevenue);
  const invoiceCount = baseInvoiceCount;
  const averageSale = totalSales / invoiceCount;

  // Generate random first and last sale dates within the period
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const firstSaleDays = Math.floor(Math.random() * (daysDiff * 0.3)); // First 30% of period
  const lastSaleDays = Math.floor(Math.random() * (daysDiff * 0.3)) + (daysDiff * 0.7); // Last 30% of period

  const firstSaleDate = new Date(start.getTime() + firstSaleDays * 24 * 60 * 60 * 1000);
  const lastSaleDate = new Date(start.getTime() + lastSaleDays * 24 * 60 * 60 * 1000);

  // Generate sales growth (comparing to previous period)
  const salesGrowth = (Math.random() - 0.3) * 100; // -30% to +70% growth

  // Generate top products
  const numberOfProducts = Math.min(3, Math.floor(Math.random() * 5) + 1);
  const selectedProducts = [...productList]
    .sort(() => Math.random() - 0.5)
    .slice(0, numberOfProducts);

  const topProducts = selectedProducts.map(product => ({
    product,
    quantity: Math.floor(Math.random() * 10) + 1,
    revenue: Math.round(totalSales * (Math.random() * 0.4 + 0.1)) // 10-50% of total revenue
  }));

  return {
    customerId: customer.id,
    customerName: customer.name,
    customerType: customer.type,
    totalSales,
    invoiceCount,
    averageSale: Math.round(averageSale),
    firstSaleDate: firstSaleDate.toISOString(),
    lastSaleDate: lastSaleDate.toISOString(),
    salesGrowth: Math.round(salesGrowth * 10) / 10,
    topProducts
  };
}

// Sort customers based on criteria
function sortCustomers(customers: CustomerSale[], sortBy: string): CustomerSale[] {
  return [...customers].sort((a, b) => {
    switch (sortBy) {
      case 'customerName':
        return a.customerName.localeCompare(b.customerName);
      case 'totalSales':
        return b.totalSales - a.totalSales;
      case 'invoiceCount':
        return b.invoiceCount - a.invoiceCount;
      case 'averageSale':
        return b.averageSale - a.averageSale;
      case 'salesGrowth':
        return b.salesGrowth - a.salesGrowth;
      default:
        return b.totalSales - a.totalSales;
    }
  });
}

// Filter customers by type
function filterCustomersByType(customers: CustomerSale[], customerType: string): CustomerSale[] {
  if (customerType === 'all') return customers;
  return customers.filter(customer => customer.customerType === customerType);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerType = searchParams.get('customerType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'totalSales';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Generate sales data for all customers
    let customers = customerDatabase.map(customer => 
      generateCustomerSales(customer, startDate, endDate)
    );

    // Filter by customer type if specified
    customers = filterCustomersByType(customers, customerType);

    // Sort customers
    customers = sortCustomers(customers, sortBy);

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const totalSales = customers.reduce((sum, customer) => sum + customer.totalSales, 0);
    const averageSalePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0;
    
    const topCustomer = customers.length > 0 ? customers[0] : null;
    const topCustomerRevenue = topCustomer ? topCustomer.totalSales : 0;
    const topCustomerName = topCustomer ? topCustomer.customerName : 'N/A';

    // Calculate new vs returning customers (simplified)
    const newCustomers = Math.floor(totalCustomers * 0.25); // Assume 25% are new
    const returningCustomers = totalCustomers - newCustomers;

    // Get top 5 customers
    const topCustomers = customers.slice(0, 5);

    // Calculate customer type breakdown
    const customerTypes = {
      individual: {
        count: customers.filter(c => c.customerType === 'Individual').length,
        revenue: customers.filter(c => c.customerType === 'Individual')
          .reduce((sum, c) => sum + c.totalSales, 0)
      },
      business: {
        count: customers.filter(c => c.customerType === 'Business').length,
        revenue: customers.filter(c => c.customerType === 'Business')
          .reduce((sum, c) => sum + c.totalSales, 0)
      },
      government: {
        count: customers.filter(c => c.customerType === 'Government').length,
        revenue: customers.filter(c => c.customerType === 'Government')
          .reduce((sum, c) => sum + c.totalSales, 0)
      }
    };

    const reportData: SalesByCustomerData = {
      reportPeriod: {
        startDate,
        endDate
      },
      summary: {
        totalCustomers,
        totalSales: Math.round(totalSales),
        averageSalePerCustomer: Math.round(averageSalePerCustomer),
        topCustomerRevenue,
        topCustomerName,
        newCustomers,
        returningCustomers
      },
      customers,
      topCustomers,
      customerTypes
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating sales by customer report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
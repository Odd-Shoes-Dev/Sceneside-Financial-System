import { NextRequest, NextResponse } from 'next/server';

interface VendorAging {
  vendorId: string;
  vendorName: string;
  vendorType: 'Supplier' | 'Service Provider' | 'Contractor' | 'Utility';
  totalAmount: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  oldestInvoiceDate: string;
  invoiceCount: number;
  averagePaymentDays: number;
  creditLimit: number;
  lastPaymentDate: string;
  paymentTerms: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportDate = searchParams.get('reportDate') || new Date().toISOString().split('T')[0];
    const vendorType = searchParams.get('vendorType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'totalAmount';
    const showCriticalOnly = searchParams.get('showCriticalOnly') === 'true';

    // Generate comprehensive AP aging data with realistic business scenarios
    const vendors: VendorAging[] = [
      // Critical Vendors - High Risk
      {
        vendorId: 'v001',
        vendorName: 'Industrial Supply Corp.',
        vendorType: 'Supplier',
        totalAmount: 45750.00,
        current: 12500.00,
        days1to30: 8900.00,
        days31to60: 11200.00,
        days61to90: 7650.00,
        over90: 5500.00,
        oldestInvoiceDate: '2024-08-15',
        invoiceCount: 18,
        averagePaymentDays: 68,
        creditLimit: 75000.00,
        lastPaymentDate: '2024-11-28',
        paymentTerms: 'Net 30'
      },
      {
        vendorId: 'v002',
        vendorName: 'TechCorp Solutions',
        vendorType: 'Service Provider',
        totalAmount: 38200.00,
        current: 15600.00,
        days1to30: 9800.00,
        days31to60: 6200.00,
        days61to90: 4100.00,
        over90: 2500.00,
        oldestInvoiceDate: '2024-09-02',
        invoiceCount: 12,
        averagePaymentDays: 52,
        creditLimit: 50000.00,
        lastPaymentDate: '2024-12-02',
        paymentTerms: 'Net 30'
      },
      
      // High Volume Suppliers
      {
        vendorId: 'v003',
        vendorName: 'Boston Materials Inc.',
        vendorType: 'Supplier',
        totalAmount: 62400.00,
        current: 28900.00,
        days1to30: 18700.00,
        days31to60: 10200.00,
        days61to90: 4600.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-08',
        invoiceCount: 24,
        averagePaymentDays: 42,
        creditLimit: 100000.00,
        lastPaymentDate: '2024-12-05',
        paymentTerms: 'Net 45'
      },
      {
        vendorId: 'v004',
        vendorName: 'Atlantic Construction Co.',
        vendorType: 'Contractor',
        totalAmount: 89500.00,
        current: 32000.00,
        days1to30: 26400.00,
        days31to60: 18600.00,
        days61to90: 12500.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-12',
        invoiceCount: 8,
        averagePaymentDays: 38,
        creditLimit: 125000.00,
        lastPaymentDate: '2024-12-01',
        paymentTerms: 'Net 60'
      },
      
      // Utilities and Services
      {
        vendorId: 'v005',
        vendorName: 'Eversource Energy',
        vendorType: 'Utility',
        totalAmount: 18900.00,
        current: 6200.00,
        days1to30: 5800.00,
        days31to60: 3600.00,
        days61to90: 2100.00,
        over90: 1200.00,
        oldestInvoiceDate: '2024-09-15',
        invoiceCount: 36,
        averagePaymentDays: 35,
        creditLimit: 25000.00,
        lastPaymentDate: '2024-12-03',
        paymentTerms: 'Net 15'
      },
      {
        vendorId: 'v006',
        vendorName: 'Professional Services LLC',
        vendorType: 'Service Provider',
        totalAmount: 24800.00,
        current: 12400.00,
        days1to30: 7200.00,
        days31to60: 3500.00,
        days61to90: 1700.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-25',
        invoiceCount: 15,
        averagePaymentDays: 28,
        creditLimit: 35000.00,
        lastPaymentDate: '2024-12-04',
        paymentTerms: 'Net 30'
      },
      
      // Regular Suppliers
      {
        vendorId: 'v007',
        vendorName: 'Office Depot Business',
        vendorType: 'Supplier',
        totalAmount: 8750.00,
        current: 3200.00,
        days1to30: 2800.00,
        days31to60: 1950.00,
        days61to90: 800.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-30',
        invoiceCount: 22,
        averagePaymentDays: 32,
        creditLimit: 15000.00,
        lastPaymentDate: '2024-11-30',
        paymentTerms: 'Net 30'
      },
      {
        vendorId: 'v008',
        vendorName: 'Metro Cleaning Services',
        vendorType: 'Service Provider',
        totalAmount: 15600.00,
        current: 5200.00,
        days1to30: 5200.00,
        days31to60: 3100.00,
        days61to90: 2100.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-20',
        invoiceCount: 12,
        averagePaymentDays: 25,
        creditLimit: 20000.00,
        lastPaymentDate: '2024-12-01',
        paymentTerms: 'Net 30'
      },
      
      // Equipment and Technology
      {
        vendorId: 'v009',
        vendorName: 'Equipment Rental Plus',
        vendorType: 'Supplier',
        totalAmount: 32100.00,
        current: 14600.00,
        days1to30: 9800.00,
        days31to60: 4900.00,
        days61to90: 2800.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-18',
        invoiceCount: 16,
        averagePaymentDays: 29,
        creditLimit: 50000.00,
        lastPaymentDate: '2024-11-29',
        paymentTerms: 'Net 30'
      },
      {
        vendorId: 'v010',
        vendorName: 'Network Solutions Inc.',
        vendorType: 'Service Provider',
        totalAmount: 19800.00,
        current: 8900.00,
        days1to30: 6200.00,
        days31to60: 3100.00,
        days61to90: 1600.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-22',
        invoiceCount: 9,
        averagePaymentDays: 31,
        creditLimit: 30000.00,
        lastPaymentDate: '2024-12-02',
        paymentTerms: 'Net 30'
      },
      
      // Additional Contractors
      {
        vendorId: 'v011',
        vendorName: 'Elite HVAC Systems',
        vendorType: 'Contractor',
        totalAmount: 28900.00,
        current: 15200.00,
        days1to30: 8100.00,
        days31to60: 3800.00,
        days61to90: 1800.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-28',
        invoiceCount: 7,
        averagePaymentDays: 24,
        creditLimit: 40000.00,
        lastPaymentDate: '2024-12-03',
        paymentTerms: 'Net 45'
      },
      {
        vendorId: 'v012',
        vendorName: 'Security Plus Solutions',
        vendorType: 'Service Provider',
        totalAmount: 21400.00,
        current: 7100.00,
        days1to30: 7100.00,
        days31to60: 4200.00,
        days61to90: 3000.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-19',
        invoiceCount: 12,
        averagePaymentDays: 33,
        creditLimit: 35000.00,
        lastPaymentDate: '2024-11-28',
        paymentTerms: 'Net 30'
      },
      
      // Specialty Services
      {
        vendorId: 'v013',
        vendorName: 'Marketing Dynamics LLC',
        vendorType: 'Service Provider',
        totalAmount: 16800.00,
        current: 8400.00,
        days1to30: 4200.00,
        days31to60: 2600.00,
        days61to90: 1600.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-26',
        invoiceCount: 6,
        averagePaymentDays: 27,
        creditLimit: 25000.00,
        lastPaymentDate: '2024-12-04',
        paymentTerms: 'Net 30'
      },
      {
        vendorId: 'v014',
        vendorName: 'Verizon Business',
        vendorType: 'Utility',
        totalAmount: 12600.00,
        current: 4200.00,
        days1to30: 4200.00,
        days31to60: 2500.00,
        days61to90: 1700.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-24',
        invoiceCount: 24,
        averagePaymentDays: 22,
        creditLimit: 20000.00,
        lastPaymentDate: '2024-12-02',
        paymentTerms: 'Net 30'
      },
      
      // Additional Suppliers
      {
        vendorId: 'v015',
        vendorName: 'Regional Auto Parts',
        vendorType: 'Supplier',
        totalAmount: 11900.00,
        current: 4800.00,
        days1to30: 3600.00,
        days31to60: 2100.00,
        days61to90: 1400.00,
        over90: 0.00,
        oldestInvoiceDate: '2024-10-27',
        invoiceCount: 18,
        averagePaymentDays: 26,
        creditLimit: 18000.00,
        lastPaymentDate: '2024-12-01',
        paymentTerms: 'Net 30'
      }
    ];

    // Apply filters
    let filteredVendors = vendors;

    if (vendorType !== 'all') {
      filteredVendors = filteredVendors.filter(vendor => vendor.vendorType === vendorType);
    }

    if (showCriticalOnly) {
      filteredVendors = filteredVendors.filter(vendor => vendor.over90 > 0 || vendor.days61to90 > 0);
    }

    // Apply sorting
    filteredVendors.sort((a, b) => {
      switch (sortBy) {
        case 'vendorName':
          return a.vendorName.localeCompare(b.vendorName);
        case 'over90':
          return b.over90 - a.over90;
        case 'days61to90':
          return b.days61to90 - a.days61to90;
        case 'averagePaymentDays':
          return b.averagePaymentDays - a.averagePaymentDays;
        case 'totalAmount':
        default:
          return b.totalAmount - a.totalAmount;
      }
    });

    // Calculate summary statistics
    const totalPayables = filteredVendors.reduce((sum, vendor) => sum + vendor.totalAmount, 0);
    const currentTotal = filteredVendors.reduce((sum, vendor) => sum + vendor.current, 0);
    const days1to30Total = filteredVendors.reduce((sum, vendor) => sum + vendor.days1to30, 0);
    const days31to60Total = filteredVendors.reduce((sum, vendor) => sum + vendor.days31to60, 0);
    const days61to90Total = filteredVendors.reduce((sum, vendor) => sum + vendor.days61to90, 0);
    const over90Total = filteredVendors.reduce((sum, vendor) => sum + vendor.over90, 0);
    const criticalVendors = filteredVendors.filter(vendor => vendor.over90 > 0 || vendor.days61to90 > 0).length;
    const averagePaymentDays = filteredVendors.length > 0 
      ? filteredVendors.reduce((sum, vendor) => sum + vendor.averagePaymentDays, 0) / filteredVendors.length
      : 0;

    // Generate aging buckets with percentage analysis
    const agingBuckets = [
      {
        bucket: 'Current',
        amount: currentTotal,
        percentage: totalPayables > 0 ? (currentTotal / totalPayables) * 100 : 0,
        vendorCount: filteredVendors.filter(v => v.current > 0).length
      },
      {
        bucket: '1-30 Days',
        amount: days1to30Total,
        percentage: totalPayables > 0 ? (days1to30Total / totalPayables) * 100 : 0,
        vendorCount: filteredVendors.filter(v => v.days1to30 > 0).length
      },
      {
        bucket: '31-60 Days',
        amount: days31to60Total,
        percentage: totalPayables > 0 ? (days31to60Total / totalPayables) * 100 : 0,
        vendorCount: filteredVendors.filter(v => v.days31to60 > 0).length
      },
      {
        bucket: '61-90 Days',
        amount: days61to90Total,
        percentage: totalPayables > 0 ? (days61to90Total / totalPayables) * 100 : 0,
        vendorCount: filteredVendors.filter(v => v.days61to90 > 0).length
      },
      {
        bucket: 'Over 90 Days',
        amount: over90Total,
        percentage: totalPayables > 0 ? (over90Total / totalPayables) * 100 : 0,
        vendorCount: filteredVendors.filter(v => v.over90 > 0).length
      }
    ];

    // Generate vendor type analysis
    const vendorTypes = ['Supplier', 'Service Provider', 'Contractor', 'Utility'].map(type => {
      const typeVendors = filteredVendors.filter(v => v.vendorType === type);
      const totalAmount = typeVendors.reduce((sum, v) => sum + v.totalAmount, 0);
      return {
        type,
        vendorCount: typeVendors.length,
        totalAmount,
        averageAmount: typeVendors.length > 0 ? totalAmount / typeVendors.length : 0
      };
    }).filter(type => type.vendorCount > 0);

    const response = {
      reportDate,
      summary: {
        totalVendors: filteredVendors.length,
        totalPayables,
        current: currentTotal,
        days1to30: days1to30Total,
        days31to60: days31to60Total,
        days61to90: days61to90Total,
        over90: over90Total,
        averagePaymentDays,
        criticalVendors
      },
      vendors: filteredVendors,
      agingBuckets,
      vendorTypes
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AP aging report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AP aging report' },
      { status: 500 }
    );
  }
}
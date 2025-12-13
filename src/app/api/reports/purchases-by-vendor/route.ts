import { NextRequest, NextResponse } from 'next/server';

interface VendorPurchase {
  vendorId: string;
  vendorName: string;
  vendorType: 'Supplier' | 'Service Provider' | 'Contractor' | 'Utility' | 'Manufacturing';
  totalPurchases: number;
  purchaseCount: number;
  averagePurchase: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  purchaseGrowth: number; // percentage
  paymentTerms: string;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  performanceScore: number; // 1-100
  onTimeDelivery: number; // percentage
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const vendorType = searchParams.get('vendorType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'totalPurchases';
    const minAmount = parseFloat(searchParams.get('minAmount') || '0');

    // Generate comprehensive vendor purchase data with realistic business scenarios
    const vendors: VendorPurchase[] = [
      // Top Suppliers - High Volume
      {
        vendorId: 'v001',
        vendorName: 'Industrial Materials Corp.',
        vendorType: 'Supplier',
        totalPurchases: 284750.00,
        purchaseCount: 45,
        averagePurchase: 6327.78,
        firstPurchaseDate: '2024-01-15',
        lastPurchaseDate: '2024-12-08',
        purchaseGrowth: 23.5,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Raw Materials', amount: 156200.00, percentage: 54.8 },
          { category: 'Equipment Parts', amount: 89300.00, percentage: 31.4 },
          { category: 'Tools & Hardware', amount: 39250.00, percentage: 13.8 }
        ],
        performanceScore: 92,
        onTimeDelivery: 94.2
      },
      {
        vendorId: 'v002',
        vendorName: 'TechCore Solutions',
        vendorType: 'Service Provider',
        totalPurchases: 198600.00,
        purchaseCount: 24,
        averagePurchase: 8275.00,
        firstPurchaseDate: '2024-02-01',
        lastPurchaseDate: '2024-12-05',
        purchaseGrowth: 18.2,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'IT Services', amount: 125400.00, percentage: 63.1 },
          { category: 'Software Licenses', amount: 48900.00, percentage: 24.6 },
          { category: 'Consulting', amount: 24300.00, percentage: 12.2 }
        ],
        performanceScore: 88,
        onTimeDelivery: 91.7
      },
      
      // Manufacturing Partners
      {
        vendorId: 'v003',
        vendorName: 'Precision Manufacturing LLC',
        vendorType: 'Manufacturing',
        totalPurchases: 356400.00,
        purchaseCount: 18,
        averagePurchase: 19800.00,
        firstPurchaseDate: '2024-01-08',
        lastPurchaseDate: '2024-11-28',
        purchaseGrowth: 31.8,
        paymentTerms: 'Net 45',
        topCategories: [
          { category: 'Custom Parts', amount: 198000.00, percentage: 55.6 },
          { category: 'Assemblies', amount: 124200.00, percentage: 34.8 },
          { category: 'Prototyping', amount: 34200.00, percentage: 9.6 }
        ],
        performanceScore: 96,
        onTimeDelivery: 98.3
      },
      {
        vendorId: 'v004',
        vendorName: 'Boston Fabrication Works',
        vendorType: 'Manufacturing',
        totalPurchases: 245800.00,
        purchaseCount: 32,
        averagePurchase: 7681.25,
        firstPurchaseDate: '2024-01-22',
        lastPurchaseDate: '2024-12-03',
        purchaseGrowth: 15.6,
        paymentTerms: 'Net 60',
        topCategories: [
          { category: 'Metal Fabrication', amount: 147480.00, percentage: 60.0 },
          { category: 'Welding Services', amount: 73740.00, percentage: 30.0 },
          { category: 'Finishing', amount: 24580.00, percentage: 10.0 }
        ],
        performanceScore: 85,
        onTimeDelivery: 87.5
      },
      
      // Construction & Contractors
      {
        vendorId: 'v005',
        vendorName: 'Elite Construction Partners',
        vendorType: 'Contractor',
        totalPurchases: 189300.00,
        purchaseCount: 12,
        averagePurchase: 15775.00,
        firstPurchaseDate: '2024-03-15',
        lastPurchaseDate: '2024-11-20',
        purchaseGrowth: 42.1,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'General Construction', amount: 113580.00, percentage: 60.0 },
          { category: 'Electrical Work', amount: 56790.00, percentage: 30.0 },
          { category: 'Plumbing', amount: 18930.00, percentage: 10.0 }
        ],
        performanceScore: 78,
        onTimeDelivery: 82.3
      },
      {
        vendorId: 'v006',
        vendorName: 'Metro HVAC Systems',
        vendorType: 'Contractor',
        totalPurchases: 124600.00,
        purchaseCount: 16,
        averagePurchase: 7787.50,
        firstPurchaseDate: '2024-02-28',
        lastPurchaseDate: '2024-12-01',
        purchaseGrowth: 8.7,
        paymentTerms: 'Net 45',
        topCategories: [
          { category: 'HVAC Installation', amount: 87220.00, percentage: 70.0 },
          { category: 'Maintenance', amount: 24920.00, percentage: 20.0 },
          { category: 'Repairs', amount: 12460.00, percentage: 10.0 }
        ],
        performanceScore: 91,
        onTimeDelivery: 93.8
      },
      
      // Office & Business Suppliers
      {
        vendorId: 'v007',
        vendorName: 'Corporate Office Solutions',
        vendorType: 'Supplier',
        totalPurchases: 67800.00,
        purchaseCount: 28,
        averagePurchase: 2421.43,
        firstPurchaseDate: '2024-01-10',
        lastPurchaseDate: '2024-12-04',
        purchaseGrowth: 12.3,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Office Supplies', amount: 40680.00, percentage: 60.0 },
          { category: 'Furniture', amount: 20340.00, percentage: 30.0 },
          { category: 'Technology', amount: 6780.00, percentage: 10.0 }
        ],
        performanceScore: 89,
        onTimeDelivery: 96.4
      },
      {
        vendorId: 'v008',
        vendorName: 'Digital Marketing Plus',
        vendorType: 'Service Provider',
        totalPurchases: 89400.00,
        purchaseCount: 15,
        averagePurchase: 5960.00,
        firstPurchaseDate: '2024-02-14',
        lastPurchaseDate: '2024-11-30',
        purchaseGrowth: 28.9,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Digital Advertising', amount: 53640.00, percentage: 60.0 },
          { category: 'Content Creation', amount: 26820.00, percentage: 30.0 },
          { category: 'SEO Services', amount: 8940.00, percentage: 10.0 }
        ],
        performanceScore: 94,
        onTimeDelivery: 99.1
      },
      
      // Utilities & Services
      {
        vendorId: 'v009',
        vendorName: 'Eversource Energy',
        vendorType: 'Utility',
        totalPurchases: 52800.00,
        purchaseCount: 36,
        averagePurchase: 1466.67,
        firstPurchaseDate: '2024-01-01',
        lastPurchaseDate: '2024-12-01',
        purchaseGrowth: 5.2,
        paymentTerms: 'Net 15',
        topCategories: [
          { category: 'Electricity', amount: 42240.00, percentage: 80.0 },
          { category: 'Natural Gas', amount: 7920.00, percentage: 15.0 },
          { category: 'Service Fees', amount: 2640.00, percentage: 5.0 }
        ],
        performanceScore: 97,
        onTimeDelivery: 100.0
      },
      {
        vendorId: 'v010',
        vendorName: 'Verizon Business Services',
        vendorType: 'Utility',
        totalPurchases: 38900.00,
        purchaseCount: 24,
        averagePurchase: 1620.83,
        firstPurchaseDate: '2024-01-05',
        lastPurchaseDate: '2024-11-25',
        purchaseGrowth: 3.8,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Internet/Phone', amount: 31120.00, percentage: 80.0 },
          { category: 'Mobile Services', amount: 5835.00, percentage: 15.0 },
          { category: 'Equipment', amount: 1945.00, percentage: 5.0 }
        ],
        performanceScore: 92,
        onTimeDelivery: 98.7
      },
      
      // Specialized Services
      {
        vendorId: 'v011',
        vendorName: 'Legal Advisors LLC',
        vendorType: 'Service Provider',
        totalPurchases: 156300.00,
        purchaseCount: 22,
        averagePurchase: 7104.55,
        firstPurchaseDate: '2024-01-20',
        lastPurchaseDate: '2024-11-15',
        purchaseGrowth: 19.4,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Legal Consultation', amount: 109410.00, percentage: 70.0 },
          { category: 'Contract Review', amount: 31260.00, percentage: 20.0 },
          { category: 'Compliance', amount: 15630.00, percentage: 10.0 }
        ],
        performanceScore: 95,
        onTimeDelivery: 97.3
      },
      {
        vendorId: 'v012',
        vendorName: 'Security Solutions Inc.',
        vendorType: 'Service Provider',
        totalPurchases: 94700.00,
        purchaseCount: 20,
        averagePurchase: 4735.00,
        firstPurchaseDate: '2024-01-30',
        lastPurchaseDate: '2024-12-02',
        purchaseGrowth: 15.8,
        paymentTerms: 'Net 45',
        topCategories: [
          { category: 'Security Systems', amount: 66290.00, percentage: 70.0 },
          { category: 'Monitoring Services', amount: 18940.00, percentage: 20.0 },
          { category: 'Maintenance', amount: 9470.00, percentage: 10.0 }
        ],
        performanceScore: 87,
        onTimeDelivery: 89.5
      },
      
      // Transportation & Logistics
      {
        vendorId: 'v013',
        vendorName: 'Express Logistics Partners',
        vendorType: 'Service Provider',
        totalPurchases: 78500.00,
        purchaseCount: 42,
        averagePurchase: 1869.05,
        firstPurchaseDate: '2024-01-12',
        lastPurchaseDate: '2024-12-06',
        purchaseGrowth: 22.7,
        paymentTerms: 'Net 30',
        topCategories: [
          { category: 'Shipping', amount: 54950.00, percentage: 70.0 },
          { category: 'Warehousing', amount: 15700.00, percentage: 20.0 },
          { category: 'Handling', amount: 7850.00, percentage: 10.0 }
        ],
        performanceScore: 93,
        onTimeDelivery: 95.2
      },
      {
        vendorId: 'v014',
        vendorName: 'Fleet Management Solutions',
        vendorType: 'Service Provider',
        totalPurchases: 112400.00,
        purchaseCount: 26,
        averagePurchase: 4323.08,
        firstPurchaseDate: '2024-02-05',
        lastPurchaseDate: '2024-11-22',
        purchaseGrowth: 17.3,
        paymentTerms: 'Net 45',
        topCategories: [
          { category: 'Vehicle Maintenance', amount: 78680.00, percentage: 70.0 },
          { category: 'Fuel Management', amount: 22480.00, percentage: 20.0 },
          { category: 'Insurance', amount: 11240.00, percentage: 10.0 }
        ],
        performanceScore: 84,
        onTimeDelivery: 86.9
      },
      
      // Equipment & Technology
      {
        vendorId: 'v015',
        vendorName: 'Advanced Equipment Co.',
        vendorType: 'Supplier',
        totalPurchases: 203800.00,
        purchaseCount: 14,
        averagePurchase: 14557.14,
        firstPurchaseDate: '2024-03-01',
        lastPurchaseDate: '2024-11-18',
        purchaseGrowth: 35.2,
        paymentTerms: 'Net 60',
        topCategories: [
          { category: 'Machinery', amount: 142660.00, percentage: 70.0 },
          { category: 'Testing Equipment', amount: 40760.00, percentage: 20.0 },
          { category: 'Calibration', amount: 20380.00, percentage: 10.0 }
        ],
        performanceScore: 90,
        onTimeDelivery: 92.9
      }
    ];

    // Apply filters
    let filteredVendors = vendors;

    if (vendorType !== 'all') {
      filteredVendors = filteredVendors.filter(vendor => vendor.vendorType === vendorType);
    }

    if (minAmount > 0) {
      filteredVendors = filteredVendors.filter(vendor => vendor.totalPurchases >= minAmount);
    }

    // Apply sorting
    filteredVendors.sort((a, b) => {
      switch (sortBy) {
        case 'vendorName':
          return a.vendorName.localeCompare(b.vendorName);
        case 'purchaseCount':
          return b.purchaseCount - a.purchaseCount;
        case 'averagePurchase':
          return b.averagePurchase - a.averagePurchase;
        case 'purchaseGrowth':
          return b.purchaseGrowth - a.purchaseGrowth;
        case 'performanceScore':
          return b.performanceScore - a.performanceScore;
        case 'totalPurchases':
        default:
          return b.totalPurchases - a.totalPurchases;
      }
    });

    // Calculate summary statistics
    const totalPurchases = filteredVendors.reduce((sum, vendor) => sum + vendor.totalPurchases, 0);
    const averagePurchasePerVendor = filteredVendors.length > 0 ? totalPurchases / filteredVendors.length : 0;
    const topVendor = filteredVendors.length > 0 ? filteredVendors[0] : null;
    const newVendors = filteredVendors.filter(v => new Date(v.firstPurchaseDate) >= new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)).length;
    const recurringVendors = filteredVendors.length - newVendors;
    const averageDeliveryDays = filteredVendors.length > 0 
      ? filteredVendors.reduce((sum, v) => sum + (100 - v.onTimeDelivery) * 2, 0) / filteredVendors.length
      : 0;

    // Get top 10 vendors for highlights
    const topVendors = filteredVendors.slice(0, 10);

    // Calculate vendor type breakdown
    const vendorTypeStats = {
      supplier: {
        count: filteredVendors.filter(v => v.vendorType === 'Supplier').length,
        spending: filteredVendors.filter(v => v.vendorType === 'Supplier').reduce((sum, v) => sum + v.totalPurchases, 0)
      },
      serviceProvider: {
        count: filteredVendors.filter(v => v.vendorType === 'Service Provider').length,
        spending: filteredVendors.filter(v => v.vendorType === 'Service Provider').reduce((sum, v) => sum + v.totalPurchases, 0)
      },
      contractor: {
        count: filteredVendors.filter(v => v.vendorType === 'Contractor').length,
        spending: filteredVendors.filter(v => v.vendorType === 'Contractor').reduce((sum, v) => sum + v.totalPurchases, 0)
      },
      utility: {
        count: filteredVendors.filter(v => v.vendorType === 'Utility').length,
        spending: filteredVendors.filter(v => v.vendorType === 'Utility').reduce((sum, v) => sum + v.totalPurchases, 0)
      },
      manufacturing: {
        count: filteredVendors.filter(v => v.vendorType === 'Manufacturing').length,
        spending: filteredVendors.filter(v => v.vendorType === 'Manufacturing').reduce((sum, v) => sum + v.totalPurchases, 0)
      }
    };

    // Generate category analysis
    const categoryMap = new Map<string, { totalSpending: number; vendorCount: number }>();
    
    filteredVendors.forEach(vendor => {
      vendor.topCategories.forEach(cat => {
        const existing = categoryMap.get(cat.category) || { totalSpending: 0, vendorCount: 0 };
        categoryMap.set(cat.category, {
          totalSpending: existing.totalSpending + cat.amount,
          vendorCount: existing.vendorCount + 1
        });
      });
    });

    const categories = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        totalSpending: stats.totalSpending,
        vendorCount: stats.vendorCount,
        averagePerVendor: stats.vendorCount > 0 ? stats.totalSpending / stats.vendorCount : 0
      }))
      .sort((a, b) => b.totalSpending - a.totalSpending)
      .slice(0, 10); // Top 10 categories

    const response = {
      reportPeriod: {
        startDate,
        endDate
      },
      summary: {
        totalVendors: filteredVendors.length,
        totalPurchases,
        averagePurchasePerVendor,
        topVendorSpending: topVendor?.totalPurchases || 0,
        topVendorName: topVendor?.vendorName || '',
        newVendors,
        recurringVendors,
        averageDeliveryDays
      },
      vendors: filteredVendors,
      topVendors,
      vendorTypes: vendorTypeStats,
      categories
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Purchases by vendor report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate purchases by vendor report' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  table: string;
  displayName: string;
}

interface Filter {
  id: string;
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between' | 'in_range';
  value: string | number | [string | number, string | number];
}

interface Sort {
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface CustomReportConfig {
  name: string;
  description: string;
  dataSource: string;
  selectedFields: string[];
  filters: Filter[];
  sorts: Sort[];
  groupBy?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

// Mock data generators for different data sources
const generateTransactionData = (config: CustomReportConfig) => {
  const transactions = [
    {
      date: '2024-12-01',
      amount: 15420.50,
      account_name: 'Medical Equipment Sales',
      account_type: 'revenue',
      description: 'Hospital Equipment - MRI Service Contract',
      reference: 'INV-2024-001',
      debit_amount: 0,
      credit_amount: 15420.50,
    },
    {
      date: '2024-12-02',
      amount: 8750.00,
      account_name: 'Pharmaceutical Sales',
      account_type: 'revenue',
      description: 'Bulk Medications - Boston General',
      reference: 'INV-2024-002',
      debit_amount: 0,
      credit_amount: 8750.00,
    },
    {
      date: '2024-12-03',
      amount: 2340.75,
      account_name: 'Office Expenses',
      account_type: 'expense',
      description: 'Office Supplies Purchase',
      reference: 'BILL-2024-045',
      debit_amount: 2340.75,
      credit_amount: 0,
    },
    {
      date: '2024-12-04',
      amount: 125000.00,
      account_name: 'Equipment Purchase',
      account_type: 'asset',
      description: 'New Diagnostic Equipment',
      reference: 'BILL-2024-046',
      debit_amount: 125000.00,
      credit_amount: 0,
    },
    {
      date: '2024-12-05',
      amount: 4500.00,
      account_name: 'Consulting Revenue',
      account_type: 'revenue',
      description: 'Medical Consulting Services',
      reference: 'INV-2024-003',
      debit_amount: 0,
      credit_amount: 4500.00,
    },
    {
      date: '2024-12-06',
      amount: 1250.00,
      account_name: 'Marketing Expenses',
      account_type: 'expense',
      description: 'Digital Marketing Campaign',
      reference: 'BILL-2024-047',
      debit_amount: 1250.00,
      credit_amount: 0,
    },
    {
      date: '2024-12-07',
      amount: 18900.00,
      account_name: 'Medical Equipment Sales',
      account_type: 'revenue',
      description: 'Surgical Instruments Package',
      reference: 'INV-2024-004',
      debit_amount: 0,
      credit_amount: 18900.00,
    },
    {
      date: '2024-12-08',
      amount: 3200.50,
      account_name: 'Professional Services',
      account_type: 'expense',
      description: 'Legal and Accounting Fees',
      reference: 'BILL-2024-048',
      debit_amount: 3200.50,
      credit_amount: 0,
    },
  ];

  // Apply filters
  let filteredData = transactions.filter(transaction => {
    if (config.dateRange) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(config.dateRange.startDate);
      const endDate = new Date(config.dateRange.endDate);
      if (transactionDate < startDate || transactionDate > endDate) {
        return false;
      }
    }

    return config.filters.every(filter => {
      const fieldValue = (transaction as any)[filter.fieldId];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals':
          return fieldValue == filterValue;
        case 'not_equals':
          return fieldValue != filterValue;
        case 'greater_than':
          return Number(fieldValue) > Number(filterValue);
        case 'less_than':
          return Number(fieldValue) < Number(filterValue);
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
        default:
          return true;
      }
    });
  });

  // Apply sorting
  if (config.sorts.length > 0) {
    filteredData.sort((a, b) => {
      for (const sort of config.sorts) {
        const aValue = (a as any)[sort.fieldId];
        const bValue = (b as any)[sort.fieldId];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  return filteredData;
};

const generateCustomerData = (config: CustomReportConfig) => {
  const customers = [
    {
      customer_name: 'Boston General Hospital',
      customer_type: 'Government',
      total_sales: 245780.50,
      invoice_count: 28,
      first_sale_date: '2024-01-15',
      last_sale_date: '2024-12-01',
      average_sale: 8777.88,
    },
    {
      customer_name: 'MedTech Solutions Inc.',
      customer_type: 'Business',
      total_sales: 189240.75,
      invoice_count: 22,
      first_sale_date: '2024-02-10',
      last_sale_date: '2024-11-28',
      average_sale: 8601.85,
    },
    {
      customer_name: 'Springfield Medical Center',
      customer_type: 'Business',
      total_sales: 156890.25,
      invoice_count: 19,
      first_sale_date: '2024-01-22',
      last_sale_date: '2024-12-03',
      average_sale: 8257.38,
    },
    {
      customer_name: 'Dr. Sarah Johnson',
      customer_type: 'Individual',
      total_sales: 45670.00,
      invoice_count: 12,
      first_sale_date: '2024-03-05',
      last_sale_date: '2024-11-15',
      average_sale: 3805.83,
    },
    {
      customer_name: 'City Health Department',
      customer_type: 'Government',
      total_sales: 78920.40,
      invoice_count: 15,
      first_sale_date: '2024-02-28',
      last_sale_date: '2024-11-20',
      average_sale: 5261.36,
    },
  ];

  return applyFiltersAndSorts(customers, config);
};

const generateVendorData = (config: CustomReportConfig) => {
  const vendors = [
    {
      vendor_name: 'MedSupply Corp',
      vendor_type: 'Medical Equipment',
      total_purchases: 187650.25,
      bill_count: 24,
      first_purchase_date: '2024-01-10',
      last_purchase_date: '2024-12-04',
      average_purchase: 7818.76,
    },
    {
      vendor_name: 'BioTech Industries',
      vendor_type: 'Pharmaceuticals',
      total_purchases: 156890.50,
      bill_count: 18,
      first_purchase_date: '2024-02-15',
      last_purchase_date: '2024-11-25',
      average_purchase: 8716.14,
    },
    {
      vendor_name: 'Office Solutions LLC',
      vendor_type: 'Office Supplies',
      total_purchases: 23480.75,
      bill_count: 31,
      first_purchase_date: '2024-01-05',
      last_purchase_date: '2024-12-06',
      average_purchase: 757.44,
    },
    {
      vendor_name: 'Professional Services Inc.',
      vendor_type: 'Consulting',
      total_purchases: 45670.00,
      bill_count: 8,
      first_purchase_date: '2024-03-01',
      last_purchase_date: '2024-12-08',
      average_purchase: 5708.75,
    },
  ];

  return applyFiltersAndSorts(vendors, config);
};

const generateInventoryData = (config: CustomReportConfig) => {
  const inventory = [
    {
      item_name: 'Surgical Masks (Box of 50)',
      sku: 'MED-001',
      quantity_on_hand: 1250,
      unit_cost: 12.50,
      total_value: 15625.00,
      reorder_point: 200,
      last_movement_date: '2024-12-05',
    },
    {
      item_name: 'Digital Thermometers',
      sku: 'MED-002',
      quantity_on_hand: 85,
      unit_cost: 45.75,
      total_value: 3888.75,
      reorder_point: 25,
      last_movement_date: '2024-12-03',
    },
    {
      item_name: 'Latex Gloves (Box of 100)',
      sku: 'MED-003',
      quantity_on_hand: 450,
      unit_cost: 8.90,
      total_value: 4005.00,
      reorder_point: 100,
      last_movement_date: '2024-12-07',
    },
    {
      item_name: 'Stethoscope - Professional',
      sku: 'MED-004',
      quantity_on_hand: 15,
      unit_cost: 125.00,
      total_value: 1875.00,
      reorder_point: 5,
      last_movement_date: '2024-11-28',
    },
    {
      item_name: 'Bandages Assorted Pack',
      sku: 'MED-005',
      quantity_on_hand: 320,
      unit_cost: 15.25,
      total_value: 4880.00,
      reorder_point: 75,
      last_movement_date: '2024-12-02',
    },
  ];

  return applyFiltersAndSorts(inventory, config);
};

function applyFiltersAndSorts(data: any[], config: CustomReportConfig) {
  // Apply date range filter if applicable
  let filteredData = data;

  // Apply custom filters
  filteredData = data.filter(item => {
    return config.filters.every(filter => {
      const fieldValue = item[filter.fieldId];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals':
          return fieldValue == filterValue;
        case 'not_equals':
          return fieldValue != filterValue;
        case 'greater_than':
          return Number(fieldValue) > Number(filterValue);
        case 'less_than':
          return Number(fieldValue) < Number(filterValue);
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
        default:
          return true;
      }
    });
  });

  // Apply sorting
  if (config.sorts.length > 0) {
    filteredData.sort((a, b) => {
      for (const sort of config.sorts) {
        const aValue = a[sort.fieldId];
        const bValue = b[sort.fieldId];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  return filteredData;
}

export async function POST(request: NextRequest) {
  try {
    const config: CustomReportConfig = await request.json();
    
    let data: any[] = [];
    
    // Generate data based on selected data source
    switch (config.dataSource) {
      case 'transactions':
        data = generateTransactionData(config);
        break;
      case 'customers':
        data = generateCustomerData(config);
        break;
      case 'vendors':
        data = generateVendorData(config);
        break;
      case 'inventory':
        data = generateInventoryData(config);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid data source' },
          { status: 400 }
        );
    }

    // Filter data to only include selected fields
    const filteredRows = data.map(row => {
      const filteredRow: any = {};
      config.selectedFields.forEach(fieldId => {
        filteredRow[fieldId] = row[fieldId];
      });
      return filteredRow;
    });

    // Calculate summary statistics
    const summary = {
      totalRows: filteredRows.length,
      generatedAt: new Date().toISOString(),
      filters: config.filters.length,
      sorts: config.sorts.length,
    };

    return NextResponse.json({
      config,
      summary,
      rows: filteredRows,
    });
  } catch (error) {
    console.error('Failed to generate custom report:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom report' },
      { status: 500 }
    );
  }
}
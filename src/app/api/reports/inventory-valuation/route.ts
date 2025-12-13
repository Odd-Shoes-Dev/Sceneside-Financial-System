import { NextRequest, NextResponse } from 'next/server';

interface InventoryItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: 'Medical Equipment' | 'Surgical Instruments' | 'Disposables' | 'Pharmaceuticals' | 'Laboratory Supplies';
  location: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  unitCost: number;
  averageCost: number;
  fifoValue: number;
  lifoValue: number;
  standardCost: number;
  lastReceived: string;
  lastIssued: string;
  reorderLevel: number;
  maxLevel: number;
  leadTimeDays: number;
  supplier: string;
  lotNumbers: Array<{
    lotNumber: string;
    quantity: number;
    unitCost: number;
    expirationDate?: string;
  }>;
  totalValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
}

// Sample inventory data with realistic medical supplies
const generateInventoryData = (): InventoryItem[] => [
  {
    itemId: 'INV-001',
    itemCode: 'MED-001',
    itemName: 'MRI Machine - Siemens Magnetom',
    category: 'Medical Equipment',
    location: 'Main Warehouse',
    quantityOnHand: 1,
    unitOfMeasure: 'EA',
    unitCost: 1250000.00,
    averageCost: 1250000.00,
    fifoValue: 1250000.00,
    lifoValue: 1250000.00,
    standardCost: 1275000.00,
    lastReceived: '2024-01-15',
    lastIssued: '2024-01-15',
    reorderLevel: 0,
    maxLevel: 2,
    leadTimeDays: 120,
    supplier: 'Siemens Healthineers',
    lotNumbers: [
      {
        lotNumber: 'SH-MRI-2024-001',
        quantity: 1,
        unitCost: 1250000.00,
      }
    ],
    totalValue: 1250000.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-002',
    itemCode: 'SRG-001',
    itemName: 'Surgical Scissors - Mayo',
    category: 'Surgical Instruments',
    location: 'Surgery Suite',
    quantityOnHand: 24,
    unitOfMeasure: 'EA',
    unitCost: 125.50,
    averageCost: 128.75,
    fifoValue: 3012.00,
    lifoValue: 3090.00,
    standardCost: 130.00,
    lastReceived: '2024-01-08',
    lastIssued: '2024-01-10',
    reorderLevel: 12,
    maxLevel: 50,
    leadTimeDays: 14,
    supplier: 'Aesculap Inc.',
    lotNumbers: [
      {
        lotNumber: 'AES-SS-2024-001',
        quantity: 12,
        unitCost: 125.50,
      },
      {
        lotNumber: 'AES-SS-2024-002',
        quantity: 12,
        unitCost: 128.75,
      }
    ],
    totalValue: 3090.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-003',
    itemCode: 'DIS-001',
    itemName: 'Disposable Syringes - 10ml',
    category: 'Disposables',
    location: 'Main Warehouse',
    quantityOnHand: 2500,
    unitOfMeasure: 'EA',
    unitCost: 0.85,
    averageCost: 0.82,
    fifoValue: 2125.00,
    lifoValue: 2050.00,
    standardCost: 0.80,
    lastReceived: '2024-01-12',
    lastIssued: '2024-01-12',
    reorderLevel: 1000,
    maxLevel: 5000,
    leadTimeDays: 7,
    supplier: 'BD Medical',
    lotNumbers: [
      {
        lotNumber: 'BD-SYR-2024-001',
        quantity: 1000,
        unitCost: 0.80,
        expirationDate: '2026-12-31'
      },
      {
        lotNumber: 'BD-SYR-2024-002',
        quantity: 1500,
        unitCost: 0.85,
        expirationDate: '2027-06-30'
      }
    ],
    totalValue: 2050.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-004',
    itemCode: 'PHR-001',
    itemName: 'Morphine Sulfate 10mg/ml',
    category: 'Pharmaceuticals',
    location: 'Pharmacy',
    quantityOnHand: 50,
    unitOfMeasure: 'VL',
    unitCost: 45.20,
    averageCost: 44.85,
    fifoValue: 2260.00,
    lifoValue: 2242.50,
    standardCost: 46.00,
    lastReceived: '2024-01-05',
    lastIssued: '2024-01-11',
    reorderLevel: 25,
    maxLevel: 100,
    leadTimeDays: 3,
    supplier: 'Pfizer Inc.',
    lotNumbers: [
      {
        lotNumber: 'PFZ-MOR-2024-001',
        quantity: 20,
        unitCost: 44.50,
        expirationDate: '2025-03-15'
      },
      {
        lotNumber: 'PFZ-MOR-2024-002',
        quantity: 30,
        unitCost: 45.20,
        expirationDate: '2025-08-20'
      }
    ],
    totalValue: 2242.50,
    status: 'In Stock'
  },
  {
    itemId: 'INV-005',
    itemCode: 'LAB-001',
    itemName: 'Blood Collection Tubes - EDTA',
    category: 'Laboratory Supplies',
    location: 'Laboratory',
    quantityOnHand: 1200,
    unitOfMeasure: 'EA',
    unitCost: 1.25,
    averageCost: 1.22,
    fifoValue: 1500.00,
    lifoValue: 1464.00,
    standardCost: 1.20,
    lastReceived: '2024-01-09',
    lastIssued: '2024-01-11',
    reorderLevel: 500,
    maxLevel: 2000,
    leadTimeDays: 5,
    supplier: 'Becton Dickinson',
    lotNumbers: [
      {
        lotNumber: 'BD-BCT-2024-001',
        quantity: 600,
        unitCost: 1.20,
        expirationDate: '2026-01-01'
      },
      {
        lotNumber: 'BD-BCT-2024-002',
        quantity: 600,
        unitCost: 1.25,
        expirationDate: '2026-06-15'
      }
    ],
    totalValue: 1464.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-006',
    itemCode: 'MED-002',
    itemName: 'Ventilator - Philips Respironics',
    category: 'Medical Equipment',
    location: 'Emergency Room',
    quantityOnHand: 3,
    unitOfMeasure: 'EA',
    unitCost: 28500.00,
    averageCost: 28750.00,
    fifoValue: 85500.00,
    lifoValue: 86250.00,
    standardCost: 29000.00,
    lastReceived: '2023-12-20',
    lastIssued: '2023-12-20',
    reorderLevel: 2,
    maxLevel: 8,
    leadTimeDays: 45,
    supplier: 'Philips Healthcare',
    lotNumbers: [
      {
        lotNumber: 'PHI-VNT-2023-001',
        quantity: 1,
        unitCost: 28000.00,
      },
      {
        lotNumber: 'PHI-VNT-2024-001',
        quantity: 2,
        unitCost: 28750.00,
      }
    ],
    totalValue: 86250.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-007',
    itemCode: 'SRG-002',
    itemName: 'Surgical Scalpels - Disposable',
    category: 'Surgical Instruments',
    location: 'Surgery Suite',
    quantityOnHand: 8,
    unitOfMeasure: 'EA',
    unitCost: 12.50,
    averageCost: 12.25,
    fifoValue: 100.00,
    lifoValue: 98.00,
    standardCost: 12.00,
    lastReceived: '2024-01-06',
    lastIssued: '2024-01-10',
    reorderLevel: 25,
    maxLevel: 100,
    leadTimeDays: 7,
    supplier: 'Swann-Morton Ltd.',
    lotNumbers: [
      {
        lotNumber: 'SM-SCP-2024-001',
        quantity: 8,
        unitCost: 12.50,
      }
    ],
    totalValue: 100.00,
    status: 'Low Stock'
  },
  {
    itemId: 'INV-008',
    itemCode: 'DIS-002',
    itemName: 'Latex Gloves - Sterile',
    category: 'Disposables',
    location: 'Main Warehouse',
    quantityOnHand: 800,
    unitOfMeasure: 'PR',
    unitCost: 2.15,
    averageCost: 2.12,
    fifoValue: 1720.00,
    lifoValue: 1696.00,
    standardCost: 2.10,
    lastReceived: '2024-01-07',
    lastIssued: '2024-01-12',
    reorderLevel: 500,
    maxLevel: 2000,
    leadTimeDays: 10,
    supplier: 'Ansell Healthcare',
    lotNumbers: [
      {
        lotNumber: 'ANS-GLV-2024-001',
        quantity: 400,
        unitCost: 2.10,
        expirationDate: '2027-01-01'
      },
      {
        lotNumber: 'ANS-GLV-2024-002',
        quantity: 400,
        unitCost: 2.15,
        expirationDate: '2027-03-15'
      }
    ],
    totalValue: 1696.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-009',
    itemCode: 'PHR-002',
    itemName: 'Acetaminophen 500mg',
    category: 'Pharmaceuticals',
    location: 'Pharmacy',
    quantityOnHand: 0,
    unitOfMeasure: 'TB',
    unitCost: 0.15,
    averageCost: 0.15,
    fifoValue: 0.00,
    lifoValue: 0.00,
    standardCost: 0.15,
    lastReceived: '2023-12-28',
    lastIssued: '2024-01-11',
    reorderLevel: 500,
    maxLevel: 2000,
    leadTimeDays: 2,
    supplier: 'Johnson & Johnson',
    lotNumbers: [],
    totalValue: 0.00,
    status: 'Out of Stock'
  },
  {
    itemId: 'INV-010',
    itemCode: 'LAB-002',
    itemName: 'Microscope Slides',
    category: 'Laboratory Supplies',
    location: 'Laboratory',
    quantityOnHand: 5000,
    unitOfMeasure: 'EA',
    unitCost: 0.35,
    averageCost: 0.33,
    fifoValue: 1750.00,
    lifoValue: 1650.00,
    standardCost: 0.30,
    lastReceived: '2024-01-04',
    lastIssued: '2024-01-09',
    reorderLevel: 1000,
    maxLevel: 10000,
    leadTimeDays: 14,
    supplier: 'Fisher Scientific',
    lotNumbers: [
      {
        lotNumber: 'FS-SLD-2024-001',
        quantity: 2500,
        unitCost: 0.32,
      },
      {
        lotNumber: 'FS-SLD-2024-002',
        quantity: 2500,
        unitCost: 0.35,
      }
    ],
    totalValue: 1650.00,
    status: 'Overstock'
  },
  {
    itemId: 'INV-011',
    itemCode: 'MED-003',
    itemName: 'Defibrillator - Zoll X Series',
    category: 'Medical Equipment',
    location: 'Emergency Room',
    quantityOnHand: 2,
    unitOfMeasure: 'EA',
    unitCost: 18750.00,
    averageCost: 18750.00,
    fifoValue: 37500.00,
    lifoValue: 37500.00,
    standardCost: 19000.00,
    lastReceived: '2023-11-15',
    lastIssued: '2023-11-15',
    reorderLevel: 1,
    maxLevel: 4,
    leadTimeDays: 30,
    supplier: 'Zoll Medical Corp.',
    lotNumbers: [
      {
        lotNumber: 'ZMC-DEF-2023-001',
        quantity: 2,
        unitCost: 18750.00,
      }
    ],
    totalValue: 37500.00,
    status: 'In Stock'
  },
  {
    itemId: 'INV-012',
    itemCode: 'PHR-003',
    itemName: 'Epinephrine Auto-Injector',
    category: 'Pharmaceuticals',
    location: 'Emergency Room',
    quantityOnHand: 15,
    unitOfMeasure: 'EA',
    unitCost: 125.00,
    averageCost: 122.50,
    fifoValue: 1875.00,
    lifoValue: 1837.50,
    standardCost: 120.00,
    lastReceived: '2024-01-03',
    lastIssued: '2024-01-08',
    reorderLevel: 10,
    maxLevel: 50,
    leadTimeDays: 5,
    supplier: 'Mylan Pharmaceuticals',
    lotNumbers: [
      {
        lotNumber: 'MYL-EPI-2024-001',
        quantity: 5,
        unitCost: 120.00,
        expirationDate: '2025-01-01'
      },
      {
        lotNumber: 'MYL-EPI-2024-002',
        quantity: 10,
        unitCost: 125.00,
        expirationDate: '2025-06-15'
      }
    ],
    totalValue: 1837.50,
    status: 'In Stock'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get('asOfDate') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category') || 'all';
    const location = searchParams.get('location') || 'all';
    const valuationMethod = searchParams.get('valuationMethod') || 'fifo';
    const sortBy = searchParams.get('sortBy') || 'totalValue';

    // Get all inventory data
    let inventoryData = generateInventoryData();

    // Apply filters
    if (category !== 'all') {
      inventoryData = inventoryData.filter(item => item.category === category);
    }

    if (location !== 'all') {
      inventoryData = inventoryData.filter(item => item.location === location);
    }

    // Sort data
    inventoryData.sort((a, b) => {
      switch (sortBy) {
        case 'itemName':
          return a.itemName.localeCompare(b.itemName);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'quantityOnHand':
          return b.quantityOnHand - a.quantityOnHand;
        case 'unitCost':
          return b.unitCost - a.unitCost;
        case 'totalValue':
        default:
          return b.totalValue - a.totalValue;
      }
    });

    // Calculate summary data
    const totalItems = inventoryData.length;
    const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantityOnHand, 0);
    const totalValueFIFO = inventoryData.reduce((sum, item) => sum + item.fifoValue, 0);
    const totalValueLIFO = inventoryData.reduce((sum, item) => sum + item.lifoValue, 0);
    const totalValueAverage = inventoryData.reduce((sum, item) => sum + (item.averageCost * item.quantityOnHand), 0);
    const totalValueStandard = inventoryData.reduce((sum, item) => sum + (item.standardCost * item.quantityOnHand), 0);
    const lowStockItems = inventoryData.filter(item => item.status === 'Low Stock').length;
    const outOfStockItems = inventoryData.filter(item => item.status === 'Out of Stock').length;
    const overstockItems = inventoryData.filter(item => item.status === 'Overstock').length;

    // Calculate category breakdown
    const categoryBreakdown = {
      medicalEquipment: {
        items: inventoryData.filter(item => item.category === 'Medical Equipment').length,
        quantity: inventoryData.filter(item => item.category === 'Medical Equipment').reduce((sum, item) => sum + item.quantityOnHand, 0),
        value: inventoryData.filter(item => item.category === 'Medical Equipment').reduce((sum, item) => sum + item.totalValue, 0)
      },
      surgicalInstruments: {
        items: inventoryData.filter(item => item.category === 'Surgical Instruments').length,
        quantity: inventoryData.filter(item => item.category === 'Surgical Instruments').reduce((sum, item) => sum + item.quantityOnHand, 0),
        value: inventoryData.filter(item => item.category === 'Surgical Instruments').reduce((sum, item) => sum + item.totalValue, 0)
      },
      disposables: {
        items: inventoryData.filter(item => item.category === 'Disposables').length,
        quantity: inventoryData.filter(item => item.category === 'Disposables').reduce((sum, item) => sum + item.quantityOnHand, 0),
        value: inventoryData.filter(item => item.category === 'Disposables').reduce((sum, item) => sum + item.totalValue, 0)
      },
      pharmaceuticals: {
        items: inventoryData.filter(item => item.category === 'Pharmaceuticals').length,
        quantity: inventoryData.filter(item => item.category === 'Pharmaceuticals').reduce((sum, item) => sum + item.quantityOnHand, 0),
        value: inventoryData.filter(item => item.category === 'Pharmaceuticals').reduce((sum, item) => sum + item.totalValue, 0)
      },
      laboratorySupplies: {
        items: inventoryData.filter(item => item.category === 'Laboratory Supplies').length,
        quantity: inventoryData.filter(item => item.category === 'Laboratory Supplies').reduce((sum, item) => sum + item.quantityOnHand, 0),
        value: inventoryData.filter(item => item.category === 'Laboratory Supplies').reduce((sum, item) => sum + item.totalValue, 0)
      }
    };

    // Calculate valuation method comparison
    const valuationMethods = {
      fifo: {
        totalValue: totalValueFIFO,
        variance: totalValueFIFO - totalValueAverage
      },
      lifo: {
        totalValue: totalValueLIFO,
        variance: totalValueLIFO - totalValueAverage
      },
      average: {
        totalValue: totalValueAverage,
        variance: 0
      },
      standard: {
        totalValue: totalValueStandard,
        variance: totalValueStandard - totalValueAverage
      }
    };

    const response = {
      reportPeriod: {
        asOfDate: asOfDate
      },
      summary: {
        totalItems,
        totalQuantity,
        totalValueFIFO,
        totalValueLIFO,
        totalValueAverage,
        totalValueStandard,
        lowStockItems,
        outOfStockItems,
        overstockItems
      },
      items: inventoryData,
      categoryBreakdown,
      valuationMethods
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inventory valuation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
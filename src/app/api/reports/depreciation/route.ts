import { NextRequest, NextResponse } from 'next/server';

interface AssetDepreciation {
  assetId: string;
  assetName: string;
  assetType: 'Equipment' | 'Furniture' | 'Vehicle' | 'Building' | 'Technology';
  purchaseDate: string;
  purchasePrice: number;
  depreciationMethod: 'Straight-line' | 'Declining Balance' | 'Units of Production';
  usefulLife: number; // in years
  salvageValue: number;
  currentBookValue: number;
  accumulatedDepreciation: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
  remainingLife: number; // in months
  depreciationSchedule: Array<{
    year: number;
    beginningValue: number;
    depreciation: number;
    accumulatedDepreciation: number;
    endingValue: number;
  }>;
}

// Helper function to calculate straight-line depreciation schedule
const calculateStraightLineSchedule = (
  purchasePrice: number,
  salvageValue: number,
  usefulLife: number,
  purchaseYear: number
) => {
  const annualDepreciation = (purchasePrice - salvageValue) / usefulLife;
  const schedule = [];
  let accumulatedDep = 0;
  
  for (let year = 0; year < usefulLife; year++) {
    const beginningValue = purchasePrice - accumulatedDep;
    const yearlyDep = Math.min(annualDepreciation, beginningValue - salvageValue);
    accumulatedDep += yearlyDep;
    const endingValue = purchasePrice - accumulatedDep;
    
    schedule.push({
      year: purchaseYear + year,
      beginningValue: beginningValue,
      depreciation: yearlyDep,
      accumulatedDepreciation: accumulatedDep,
      endingValue: Math.max(endingValue, salvageValue),
    });
    
    if (endingValue <= salvageValue) break;
  }
  
  return schedule;
};

// Helper function to calculate current accumulated depreciation
const calculateCurrentDepreciation = (
  purchaseDate: string,
  purchasePrice: number,
  salvageValue: number,
  usefulLife: number,
  method: string
) => {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const monthsElapsed = (now.getFullYear() - purchase.getFullYear()) * 12 + 
                       (now.getMonth() - purchase.getMonth());
  
  const totalMonths = usefulLife * 12;
  const monthlyRate = monthsElapsed / totalMonths;
  
  if (method === 'Straight-line') {
    const totalDepreciable = purchasePrice - salvageValue;
    const accumulated = Math.min(totalDepreciable * monthlyRate, totalDepreciable);
    return {
      accumulated: accumulated,
      current: purchasePrice - accumulated,
      annual: totalDepreciable / usefulLife,
      monthly: totalDepreciable / totalMonths,
      remainingMonths: Math.max(0, totalMonths - monthsElapsed)
    };
  }
  
  // Default to straight-line for other methods in this example
  const totalDepreciable = purchasePrice - salvageValue;
  const accumulated = Math.min(totalDepreciable * monthlyRate, totalDepreciable);
  return {
    accumulated: accumulated,
    current: purchasePrice - accumulated,
    annual: totalDepreciable / usefulLife,
    monthly: totalDepreciable / totalMonths,
    remainingMonths: Math.max(0, totalMonths - monthsElapsed)
  };
};

// Sample asset depreciation data
const generateAssetData = (): AssetDepreciation[] => {
  const baseAssets = [
    {
      assetId: '1',
      assetName: 'Ultrasound Machine - GE LOGIQ P9',
      assetType: 'Equipment' as const,
      purchaseDate: '2020-03-15',
      purchasePrice: 125000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 10,
      salvageValue: 12500,
    },
    {
      assetId: '2',
      assetName: 'MRI Scanner - Siemens MAGNETOM',
      assetType: 'Equipment' as const,
      purchaseDate: '2019-08-20',
      purchasePrice: 850000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 15,
      salvageValue: 85000,
    },
    {
      assetId: '3',
      assetName: 'Surgical Robot - da Vinci Xi',
      assetType: 'Equipment' as const,
      purchaseDate: '2021-01-10',
      purchasePrice: 2500000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 12,
      salvageValue: 250000,
    },
    {
      assetId: '4',
      assetName: 'Executive Conference Table Set',
      assetType: 'Furniture' as const,
      purchaseDate: '2022-06-01',
      purchasePrice: 15000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 7,
      salvageValue: 1500,
    },
    {
      assetId: '5',
      assetName: 'Medical Office Furniture Suite',
      assetType: 'Furniture' as const,
      purchaseDate: '2021-09-15',
      purchasePrice: 45000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 8,
      salvageValue: 4500,
    },
    {
      assetId: '6',
      assetName: 'Mercedes Sprinter Medical Van',
      assetType: 'Vehicle' as const,
      purchaseDate: '2022-02-28',
      purchasePrice: 85000,
      depreciationMethod: 'Declining Balance' as const,
      usefulLife: 8,
      salvageValue: 8500,
    },
    {
      assetId: '7',
      assetName: 'Toyota Prius Hybrid Fleet (3 units)',
      assetType: 'Vehicle' as const,
      purchaseDate: '2023-04-12',
      purchasePrice: 75000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 6,
      salvageValue: 15000,
    },
    {
      assetId: '8',
      assetName: 'Medical Facility Building',
      assetType: 'Building' as const,
      purchaseDate: '2018-11-30',
      purchasePrice: 2800000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 39,
      salvageValue: 280000,
    },
    {
      assetId: '9',
      assetName: 'Dell Precision Workstation Lab (12 units)',
      assetType: 'Technology' as const,
      purchaseDate: '2023-01-15',
      purchasePrice: 48000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 4,
      salvageValue: 4800,
    },
    {
      assetId: '10',
      assetName: 'HP Medical Imaging Server Cluster',
      assetType: 'Technology' as const,
      purchaseDate: '2022-08-05',
      purchasePrice: 125000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 5,
      salvageValue: 12500,
    },
    {
      assetId: '11',
      assetName: 'Sterilization Equipment - STERIS',
      assetType: 'Equipment' as const,
      purchaseDate: '2020-12-10',
      purchasePrice: 95000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 10,
      salvageValue: 9500,
    },
    {
      assetId: '12',
      assetName: 'Patient Monitor System - Philips',
      assetType: 'Equipment' as const,
      purchaseDate: '2023-03-20',
      purchasePrice: 65000,
      depreciationMethod: 'Straight-line' as const,
      usefulLife: 8,
      salvageValue: 6500,
    }
  ];

  return baseAssets.map(asset => {
    const depCalc = calculateCurrentDepreciation(
      asset.purchaseDate,
      asset.purchasePrice,
      asset.salvageValue,
      asset.usefulLife,
      asset.depreciationMethod
    );

    const purchaseYear = new Date(asset.purchaseDate).getFullYear();
    const depreciationSchedule = calculateStraightLineSchedule(
      asset.purchasePrice,
      asset.salvageValue,
      asset.usefulLife,
      purchaseYear
    );

    return {
      ...asset,
      currentBookValue: depCalc.current,
      accumulatedDepreciation: depCalc.accumulated,
      annualDepreciation: depCalc.annual,
      monthlyDepreciation: depCalc.monthly,
      remainingLife: depCalc.remainingMonths,
      depreciationSchedule: depreciationSchedule,
    };
  });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-12-01';
    const endDate = searchParams.get('endDate') || '2024-12-31';
    const assetType = searchParams.get('assetType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'purchaseDate';

    const allAssets = generateAssetData();

    // Filter assets based on parameters
    let filteredAssets = allAssets.filter(asset => {
      const assetDate = new Date(asset.purchaseDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const dateInRange = assetDate <= end; // Show all assets purchased before end date
      const typeMatch = assetType === 'all' || asset.assetType === assetType;

      return dateInRange && typeMatch;
    });

    // Sort assets
    filteredAssets.sort((a, b) => {
      switch (sortBy) {
        case 'assetName':
          return a.assetName.localeCompare(b.assetName);
        case 'assetType':
          return a.assetType.localeCompare(b.assetType);
        case 'purchasePrice':
          return b.purchasePrice - a.purchasePrice;
        case 'currentBookValue':
          return b.currentBookValue - a.currentBookValue;
        case 'annualDepreciation':
          return b.annualDepreciation - a.annualDepreciation;
        case 'purchaseDate':
        default:
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      }
    });

    // Calculate summary statistics
    const totalAssets = filteredAssets.length;
    const totalOriginalCost = filteredAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    const totalCurrentValue = filteredAssets.reduce((sum, asset) => sum + asset.currentBookValue, 0);
    const totalAccumulatedDepreciation = filteredAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
    const annualDepreciationExpense = filteredAssets.reduce((sum, asset) => sum + asset.annualDepreciation, 0);
    const monthlyDepreciationExpense = filteredAssets.reduce((sum, asset) => sum + asset.monthlyDepreciation, 0);

    // Calculate asset type breakdown
    const assetTypes = {
      equipment: {
        count: filteredAssets.filter(a => a.assetType === 'Equipment').length,
        originalCost: filteredAssets.filter(a => a.assetType === 'Equipment').reduce((sum, a) => sum + a.purchasePrice, 0),
        currentValue: filteredAssets.filter(a => a.assetType === 'Equipment').reduce((sum, a) => sum + a.currentBookValue, 0)
      },
      furniture: {
        count: filteredAssets.filter(a => a.assetType === 'Furniture').length,
        originalCost: filteredAssets.filter(a => a.assetType === 'Furniture').reduce((sum, a) => sum + a.purchasePrice, 0),
        currentValue: filteredAssets.filter(a => a.assetType === 'Furniture').reduce((sum, a) => sum + a.currentBookValue, 0)
      },
      vehicle: {
        count: filteredAssets.filter(a => a.assetType === 'Vehicle').length,
        originalCost: filteredAssets.filter(a => a.assetType === 'Vehicle').reduce((sum, a) => sum + a.purchasePrice, 0),
        currentValue: filteredAssets.filter(a => a.assetType === 'Vehicle').reduce((sum, a) => sum + a.currentBookValue, 0)
      },
      building: {
        count: filteredAssets.filter(a => a.assetType === 'Building').length,
        originalCost: filteredAssets.filter(a => a.assetType === 'Building').reduce((sum, a) => sum + a.purchasePrice, 0),
        currentValue: filteredAssets.filter(a => a.assetType === 'Building').reduce((sum, a) => sum + a.currentBookValue, 0)
      },
      technology: {
        count: filteredAssets.filter(a => a.assetType === 'Technology').length,
        originalCost: filteredAssets.filter(a => a.assetType === 'Technology').reduce((sum, a) => sum + a.purchasePrice, 0),
        currentValue: filteredAssets.filter(a => a.assetType === 'Technology').reduce((sum, a) => sum + a.currentBookValue, 0)
      }
    };

    const responseData = {
      reportPeriod: {
        startDate,
        endDate,
      },
      summary: {
        totalAssets,
        totalOriginalCost,
        totalCurrentValue,
        totalAccumulatedDepreciation,
        monthlyDepreciationExpense,
        annualDepreciationExpense,
      },
      assets: filteredAssets,
      assetTypes,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in depreciation API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch depreciation data' },
      { status: 500 }
    );
  }
}
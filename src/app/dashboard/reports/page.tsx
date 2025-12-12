'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface ReportCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const reports: ReportCard[] = [
  // Financial Statements
  {
    title: 'Profit & Loss',
    description: 'Income statement showing revenues, costs, and expenses',
    href: '/dashboard/reports/profit-loss',
    icon: CurrencyDollarIcon,
    category: 'Financial Statements',
  },
  {
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity at a point in time',
    href: '/dashboard/reports/balance-sheet',
    icon: ScaleIcon,
    category: 'Financial Statements',
  },
  {
    title: 'Cash Flow Statement',
    description: 'Cash inflows and outflows from operations, investing, and financing',
    href: '/dashboard/reports/cash-flow',
    icon: ArrowTrendingUpIcon,
    category: 'Financial Statements',
  },
  {
    title: 'Trial Balance',
    description: 'List of all account balances to verify debits equal credits',
    href: '/dashboard/reports/trial-balance',
    icon: DocumentTextIcon,
    category: 'Financial Statements',
  },
  // Receivables
  {
    title: 'Accounts Receivable Aging',
    description: 'Outstanding customer invoices by age',
    href: '/dashboard/reports/ar-aging',
    icon: ClockIcon,
    category: 'Receivables',
  },
  {
    title: 'Customer Statement',
    description: 'Transaction history and balance for a customer',
    href: '/dashboard/reports/customer-statement',
    icon: DocumentTextIcon,
    category: 'Receivables',
  },
  {
    title: 'Sales by Customer',
    description: 'Revenue breakdown by customer',
    href: '/dashboard/reports/sales-by-customer',
    icon: ChartBarIcon,
    category: 'Receivables',
  },
  {
    title: 'Sales by Product',
    description: 'Revenue breakdown by product/service',
    href: '/dashboard/reports/sales-by-product',
    icon: ChartBarIcon,
    category: 'Receivables',
  },
  // Payables
  {
    title: 'Accounts Payable Aging',
    description: 'Outstanding vendor bills by age',
    href: '/dashboard/reports/ap-aging',
    icon: ClockIcon,
    category: 'Payables',
  },
  {
    title: 'Vendor Statement',
    description: 'Transaction history and balance for a vendor',
    href: '/dashboard/reports/vendor-statement',
    icon: DocumentTextIcon,
    category: 'Payables',
  },
  {
    title: 'Purchases by Vendor',
    description: 'Expense breakdown by vendor',
    href: '/dashboard/reports/purchases-by-vendor',
    icon: ChartBarIcon,
    category: 'Payables',
  },
  // Other
  {
    title: 'General Ledger',
    description: 'Complete transaction history by account',
    href: '/dashboard/reports/general-ledger',
    icon: DocumentTextIcon,
    category: 'Accounting',
  },
  {
    title: 'Journal Entries',
    description: 'All journal entries with details',
    href: '/dashboard/reports/journal-entries',
    icon: DocumentTextIcon,
    category: 'Accounting',
  },
  {
    title: 'Asset Depreciation Schedule',
    description: 'Fixed asset depreciation over time',
    href: '/dashboard/reports/depreciation',
    icon: CalendarIcon,
    category: 'Assets',
  },
  {
    title: 'Inventory Valuation',
    description: 'Current stock value by item',
    href: '/dashboard/reports/inventory-valuation',
    icon: ChartBarIcon,
    category: 'Inventory',
  },
  {
    title: 'Tax Summary',
    description: 'Sales tax collected and payable',
    href: '/dashboard/reports/tax-summary',
    icon: CurrencyDollarIcon,
    category: 'Tax',
  },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(reports.map((r) => r.category)))];
  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter((r) => r.category === selectedCategory);

  // Group reports by category
  const groupedReports = filteredReports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, ReportCard[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and view financial reports</p>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-navy-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Reports' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {Object.entries(groupedReports).map(([category, categoryReports]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryReports.map((report) => (
              <Link
                key={report.href}
                href={report.href}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-navy-50 rounded-lg">
                      <report.icon className="w-6 h-6 text-navy-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Report Builder */}
      <div className="card bg-gradient-to-br from-purple-50 to-magenta-50 border-purple-200">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Custom Report Builder</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create custom reports with your own filters, date ranges, and groupings
              </p>
            </div>
            <Link href="/dashboard/reports/custom" className="btn-primary whitespace-nowrap">
              Build Custom Report
            </Link>
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Scheduled Reports</h2>
          <Link href="/dashboard/reports/scheduled" className="text-sm text-navy-600 font-medium">
            Manage Schedules
          </Link>
        </div>
        <div className="card-body">
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2">No scheduled reports</p>
            <p className="text-sm">Set up automatic report delivery to your email</p>
            <Link href="/dashboard/reports/scheduled/new" className="btn-secondary mt-4 inline-flex">
              Schedule a Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

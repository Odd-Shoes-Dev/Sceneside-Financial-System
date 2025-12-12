'use client';

import { useState, useEffect } from 'react';
import {
  ScaleIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    current: Array<{ account: string; balance: number }>;
    fixed: Array<{ account: string; balance: number }>;
    totalCurrent: number;
    totalFixed: number;
    totalAssets: number;
  };
  liabilities: {
    current: Array<{ account: string; balance: number }>;
    longTerm: Array<{ account: string; balance: number }>;
    totalCurrent: number;
    totalLongTerm: number;
    totalLiabilities: number;
  };
  equity: {
    items: Array<{ account: string; balance: number }>;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [asOfDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/balance-sheet?asOfDate=${asOfDate}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch balance sheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600">Financial position as of a specific date</p>
        </div>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">As of Date:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading balance sheet...</p>
        </div>
      ) : data ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Report Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <ScaleIcon className="w-6 h-6 text-[#1e3a5f]" />
              <div>
                <h2 className="font-semibold text-gray-900">Sceneside L.L.C</h2>
                <p className="text-sm text-gray-600">Balance Sheet as of {formatDate(data.asOfDate)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Assets Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                ASSETS
              </h3>

              {/* Current Assets */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assets</h4>
                <div className="space-y-1">
                  {data.assets.current.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.account}</span>
                      <span className="text-gray-900 font-medium tabular-nums">
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 mt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700 pl-4">Total Current Assets</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(data.assets.totalCurrent)}
                  </span>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fixed Assets</h4>
                <div className="space-y-1">
                  {data.assets.fixed.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.account}</span>
                      <span className="text-gray-900 font-medium tabular-nums">
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 mt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700 pl-4">Total Fixed Assets</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(data.assets.totalFixed)}
                  </span>
                </div>
              </div>

              {/* Total Assets */}
              <div className="flex justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-4 -mx-4 mt-4">
                <span className="font-bold text-gray-900">TOTAL ASSETS</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(data.assets.totalAssets)}
                </span>
              </div>
            </div>

            {/* Liabilities Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                LIABILITIES
              </h3>

              {/* Current Liabilities */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Liabilities</h4>
                <div className="space-y-1">
                  {data.liabilities.current.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.account}</span>
                      <span className="text-gray-900 font-medium tabular-nums">
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 mt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700 pl-4">Total Current Liabilities</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(data.liabilities.totalCurrent)}
                  </span>
                </div>
              </div>

              {/* Long-Term Liabilities */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Long-Term Liabilities</h4>
                <div className="space-y-1">
                  {data.liabilities.longTerm.map((item, index) => (
                    <div key={index} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600 pl-4">{item.account}</span>
                      <span className="text-gray-900 font-medium tabular-nums">
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 mt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700 pl-4">Total Long-Term Liabilities</span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(data.liabilities.totalLongTerm)}
                  </span>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="flex justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-4 -mx-4 mt-4">
                <span className="font-bold text-gray-900">TOTAL LIABILITIES</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(data.liabilities.totalLiabilities)}
                </span>
              </div>
            </div>

            {/* Equity Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                EQUITY
              </h3>

              <div className="space-y-1">
                {data.equity.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600 pl-4">{item.account}</span>
                    <span className="text-gray-900 font-medium tabular-nums">
                      {formatCurrency(item.balance)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Equity */}
              <div className="flex justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-4 -mx-4 mt-4">
                <span className="font-bold text-gray-900">TOTAL EQUITY</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(data.equity.totalEquity)}
                </span>
              </div>
            </div>

            {/* Total Liabilities and Equity */}
            <div className="flex justify-between py-4 border-t-4 border-double border-[#1e3a5f] bg-[#1e3a5f]/5 px-4 -mx-4 rounded-lg">
              <span className="text-lg font-bold text-[#1e3a5f]">TOTAL LIABILITIES & EQUITY</span>
              <span className="text-lg font-bold text-[#1e3a5f] tabular-nums">
                {formatCurrency(data.totalLiabilitiesAndEquity)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
}

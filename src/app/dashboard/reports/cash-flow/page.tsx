'use client';

import { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, cn } from '@/lib/utils';

interface CashFlowData {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    netIncome: number;
    adjustments: Array<{ label: string; amount: number }>;
    changesInWorkingCapital: Array<{ label: string; amount: number }>;
    netCashFromOperating: number;
  };
  investingActivities: {
    items: Array<{ label: string; amount: number }>;
    netCashFromInvesting: number;
  };
  financingActivities: {
    items: Array<{ label: string; amount: number }>;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch cash flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    console.log('Export to PDF');
  };

  const renderAmount = (amount: number) => (
    <span className={cn('tabular-nums', amount < 0 ? 'text-red-600' : 'text-gray-900')}>
      {amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
          <p className="text-gray-600">Track cash inflows and outflows</p>
        </div>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading cash flow statement...</p>
        </div>
      ) : data ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Report Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <BanknotesIcon className="w-6 h-6 text-[#1e3a5f]" />
              <div>
                <h2 className="font-semibold text-gray-900">Sceneside L.L.C</h2>
                <p className="text-sm text-gray-600">
                  Statement of Cash Flows for the period{' '}
                  {new Date(data.period.startDate).toLocaleDateString()} to{' '}
                  {new Date(data.period.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Operating Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                CASH FLOWS FROM OPERATING ACTIVITIES
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">Net Income</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(data.operatingActivities.netIncome)}
                  </span>
                </div>

                <div className="mt-3 mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Adjustments for non-cash items:
                  </p>
                </div>
                {data.operatingActivities.adjustments.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 text-sm pl-4">
                    <span className="text-gray-600">{item.label}</span>
                    {renderAmount(item.amount)}
                  </div>
                ))}

                <div className="mt-3 mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Changes in working capital:
                  </p>
                </div>
                {data.operatingActivities.changesInWorkingCapital.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 text-sm pl-4">
                    <span className="text-gray-600">{item.label}</span>
                    {renderAmount(item.amount)}
                  </div>
                ))}

                <div className="flex justify-between py-3 mt-3 border-t-2 border-gray-300 font-semibold">
                  <span className="text-gray-900">Net Cash from Operating Activities</span>
                  {renderAmount(data.operatingActivities.netCashFromOperating)}
                </div>
              </div>
            </div>

            {/* Investing Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <ArrowTrendingDownIcon className="w-5 h-5 text-blue-600" />
                CASH FLOWS FROM INVESTING ACTIVITIES
              </h3>

              <div className="space-y-2">
                {data.investingActivities.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    {renderAmount(item.amount)}
                  </div>
                ))}

                <div className="flex justify-between py-3 mt-3 border-t-2 border-gray-300 font-semibold">
                  <span className="text-gray-900">Net Cash from Investing Activities</span>
                  {renderAmount(data.investingActivities.netCashFromInvesting)}
                </div>
              </div>
            </div>

            {/* Financing Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-purple-600" />
                CASH FLOWS FROM FINANCING ACTIVITIES
              </h3>

              <div className="space-y-2">
                {data.financingActivities.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    {renderAmount(item.amount)}
                  </div>
                ))}

                <div className="flex justify-between py-3 mt-3 border-t-2 border-gray-300 font-semibold">
                  <span className="text-gray-900">Net Cash from Financing Activities</span>
                  {renderAmount(data.financingActivities.netCashFromFinancing)}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Net Change in Cash</span>
                <span className="font-semibold tabular-nums">
                  {renderAmount(data.netChangeInCash)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Beginning Cash Balance</span>
                <span className="tabular-nums">{formatCurrency(data.beginningCash)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-[#1e3a5f]">Ending Cash Balance</span>
                <span className="text-[#1e3a5f] tabular-nums">
                  {formatCurrency(data.endingCash)}
                </span>
              </div>
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

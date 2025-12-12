'use client';

import { useState, useEffect } from 'react';
import {
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

interface CustomerAging {
  customerId: string;
  customerName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

interface ARAgingData {
  asOfDate: string;
  summary: {
    totalReceivables: number;
    buckets: AgingBucket[];
  };
  customers: CustomerAging[];
}

export default function ARAgingPage() {
  const [data, setData] = useState<ARAgingData | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [asOfDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/ar-aging?asOfDate=${asOfDate}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch AR aging:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF');
  };

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case 'Current':
        return 'bg-green-100 text-green-800';
      case '1-30 Days':
        return 'bg-blue-100 text-blue-800';
      case '31-60 Days':
        return 'bg-yellow-100 text-yellow-800';
      case '61-90 Days':
        return 'bg-orange-100 text-orange-800';
      case 'Over 90 Days':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable Aging</h1>
          <p className="text-gray-600">Outstanding customer invoices by age</p>
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
          <p className="text-gray-500 mt-4">Loading AR aging report...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Total Receivables</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.summary.totalReceivables)}
              </p>
            </div>
            {data.summary.buckets.map((bucket, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-sm text-gray-500">{bucket.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(bucket.amount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{bucket.count} invoices</p>
              </div>
            ))}
          </div>

          {/* Aging Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Aging Distribution</h3>
            <div className="h-8 rounded-lg overflow-hidden flex">
              {data.summary.buckets.map((bucket, index) => {
                const percentage = (bucket.amount / data.summary.totalReceivables) * 100;
                if (percentage === 0) return null;
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-center text-xs font-medium transition-all',
                      getAgingColor(bucket.label)
                    )}
                    style={{ width: `${percentage}%` }}
                    title={`${bucket.label}: ${formatCurrency(bucket.amount)} (${percentage.toFixed(1)}%)`}
                  >
                    {percentage >= 10 && `${percentage.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {data.summary.buckets.map((bucket, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-sm', getAgingColor(bucket.label))} />
                  <span className="text-xs text-gray-600">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Detail Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-[#1e3a5f]" />
                <h3 className="font-semibold text-gray-900">Customer Aging Detail</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      1-30 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      31-60 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      61-90 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Over 90
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No outstanding receivables
                      </td>
                    </tr>
                  ) : (
                    data.customers.map((customer) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {customer.customerName}
                            </span>
                            {customer.over90 > 0 && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm">
                          {customer.current > 0 ? formatCurrency(customer.current) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm">
                          {customer.days1to30 > 0 ? formatCurrency(customer.days1to30) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm">
                          {customer.days31to60 > 0 ? (
                            <span className="text-yellow-600 font-medium">
                              {formatCurrency(customer.days31to60)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm">
                          {customer.days61to90 > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(customer.days61to90)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm">
                          {customer.over90 > 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(customer.over90)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums text-sm font-semibold text-gray-900">
                          {formatCurrency(customer.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.customers.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-gray-900">Total</td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(
                          data.customers.reduce((sum, c) => sum + c.current, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(
                          data.customers.reduce((sum, c) => sum + c.days1to30, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(
                          data.customers.reduce((sum, c) => sum + c.days31to60, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(
                          data.customers.reduce((sum, c) => sum + c.days61to90, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(
                          data.customers.reduce((sum, c) => sum + c.over90, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {formatCurrency(data.summary.totalReceivables)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
}

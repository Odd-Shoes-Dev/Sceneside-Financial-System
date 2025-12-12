'use client';

import { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, cn } from '@/lib/utils';

interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  };
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [asOfDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/trial-balance?asOfDate=${asOfDate}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch trial balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF');
  };

  const filteredAccounts =
    data?.accounts.filter(
      (account) => showZeroBalances || account.debit !== 0 || account.credit !== 0
    ) || [];

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.accountType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, TrialBalanceAccount[]>);

  const accountTypeOrder = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-gray-600">Verify that debits equal credits</p>
        </div>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">As of Date:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showZeroBalances}
              onChange={(e) => setShowZeroBalances(e.target.checked)}
              className="rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <span className="text-sm text-gray-700">Show zero balances</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading trial balance...</p>
        </div>
      ) : data ? (
        <>
          {/* Balance Status */}
          <div
            className={cn(
              'rounded-xl shadow-sm border p-4 flex items-center gap-3',
              data.totals.isBalanced
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            )}
          >
            {data.totals.isBalanced ? (
              <>
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Trial Balance is in Balance</p>
                  <p className="text-sm text-green-600">
                    Total Debits and Credits both equal {formatCurrency(data.totals.totalDebits)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Trial Balance is Out of Balance</p>
                  <p className="text-sm text-red-600">
                    Difference:{' '}
                    {formatCurrency(Math.abs(data.totals.totalDebits - data.totals.totalCredits))}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Trial Balance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="w-5 h-5 text-[#1e3a5f]" />
                <div>
                  <h3 className="font-semibold text-gray-900">Sceneside L.L.C</h3>
                  <p className="text-sm text-gray-500">
                    Trial Balance as of {new Date(data.asOfDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accountTypeOrder.map((accountType) => {
                    const accounts = groupedAccounts[accountType];
                    if (!accounts || accounts.length === 0) return null;

                    return (
                      <tr key={accountType}>
                        <td colSpan={4} className="p-0">
                          <table className="w-full">
                            <tbody>
                              {/* Account Type Header */}
                              <tr className="bg-gray-50/50">
                                <td
                                  colSpan={4}
                                  className="px-6 py-2 text-sm font-semibold text-gray-700"
                                >
                                  {accountType}s
                                </td>
                              </tr>
                              {/* Accounts */}
                              {accounts.map((account) => (
                                <tr key={account.accountCode} className="hover:bg-gray-50">
                                  <td className="px-6 py-3 text-sm text-gray-500 w-32">
                                    {account.accountCode}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-gray-900">
                                    {account.accountName}
                                  </td>
                                  <td className="px-6 py-3 text-right tabular-nums text-sm w-40">
                                    {account.debit > 0 ? formatCurrency(account.debit) : ''}
                                  </td>
                                  <td className="px-6 py-3 text-right tabular-nums text-sm w-40">
                                    {account.credit > 0 ? formatCurrency(account.credit) : ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr className="font-bold">
                    <td className="px-6 py-4" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {formatCurrency(data.totals.totalDebits)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {formatCurrency(data.totals.totalCredits)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Total Debit Balances</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totals.totalDebits)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Total Credit Balances</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totals.totalCredits)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl shadow-sm border p-4',
                data.totals.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}
            >
              <p className="text-sm text-gray-500">Difference</p>
              <p
                className={cn(
                  'text-xl font-bold mt-1',
                  data.totals.isBalanced ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatCurrency(Math.abs(data.totals.totalDebits - data.totals.totalCredits))}
              </p>
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

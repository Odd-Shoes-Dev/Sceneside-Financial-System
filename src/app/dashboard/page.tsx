'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  overdueInvoices: number;
  overdueBills: number;
  inventoryValue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentInvoices(invoices || []);

      // Get recent bills
      const { data: bills } = await supabase
        .from('bills')
        .select('*, vendors(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBills(bills || []);

      // Get stats (simplified - in production, use the reports functions)
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .eq('status', 'overdue');

      const { data: overdueBills } = await supabase
        .from('bills')
        .select('id', { count: 'exact' })
        .eq('status', 'overdue');

      // Mock stats for demo (in production, calculate from GL)
      setStats({
        totalRevenue: 125000,
        totalExpenses: 87500,
        netIncome: 37500,
        cashBalance: 45230,
        accountsReceivable: 28750,
        accountsPayable: 15420,
        overdueInvoices: overdueInvoices?.length || 0,
        overdueBills: overdueBills?.length || 0,
        inventoryValue: 32100,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: 'status-draft',
      sent: 'status-sent',
      partial: 'status-partial',
      paid: 'status-paid',
      overdue: 'status-overdue',
      approved: 'status-approved',
      void: 'status-void',
    };
    return classes[status] || 'badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-sceneside-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to Sceneside Financial System</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/invoices/new" className="btn-primary">
            New Invoice
          </Link>
          <Link href="/dashboard/expenses/new" className="btn-secondary">
            New Expense
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cash Balance"
          value={formatCurrency(stats?.cashBalance || 0)}
          icon={BanknotesIcon}
          trend={12.5}
          color="navy"
        />
        <StatCard
          title="Accounts Receivable"
          value={formatCurrency(stats?.accountsReceivable || 0)}
          icon={DocumentTextIcon}
          subtitle={`${stats?.overdueInvoices || 0} overdue`}
          color="magenta"
        />
        <StatCard
          title="Accounts Payable"
          value={formatCurrency(stats?.accountsPayable || 0)}
          icon={CurrencyDollarIcon}
          subtitle={`${stats?.overdueBills || 0} overdue`}
          color="purple"
        />
        <StatCard
          title="Net Income"
          value={formatCurrency(stats?.netIncome || 0)}
          icon={ArrowTrendingUpIcon}
          trend={8.2}
          color="green"
        />
      </div>

      {/* Alerts */}
      {((stats?.overdueInvoices || 0) > 0 || (stats?.overdueBills || 0) > 0) && (
        <div className="card border-l-4 border-l-yellow-500 bg-yellow-50">
          <div className="card-body flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Attention Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have {stats?.overdueInvoices || 0} overdue invoices and{' '}
                {stats?.overdueBills || 0} overdue bills that need attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
            <Link
              href="/dashboard/invoices"
              className="text-sm text-sceneside-magenta hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No invoices yet.{' '}
                <Link href="/dashboard/invoices/new" className="text-sceneside-magenta hover:underline">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.customers?.name || 'Unknown Customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Bills</h2>
            <Link
              href="/dashboard/bills"
              className="text-sm text-sceneside-magenta hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBills.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No bills yet.{' '}
                <Link href="/dashboard/bills/new" className="text-sceneside-magenta hover:underline">
                  Add your first bill
                </Link>
              </div>
            ) : (
              recentBills.map((bill) => (
                <Link
                  key={bill.id}
                  href={`/dashboard/bills/${bill.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {bill.bill_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bill.vendors?.name || 'Unknown Vendor'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(bill.total)}
                      </p>
                      <span className={getStatusBadge(bill.status)}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {recentInvoices.length}
              </p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {recentBills.length}
              </p>
              <p className="text-sm text-gray-500">Total Bills</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.inventoryValue || 0)}
              </p>
              <p className="text-sm text-gray-500">Inventory Value</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  subtitle?: string;
  color: 'navy' | 'magenta' | 'purple' | 'green';
}) {
  const colorClasses = {
    navy: 'bg-sceneside-navy',
    magenta: 'bg-sceneside-magenta',
    purple: 'bg-sceneside-purple',
    green: 'bg-green-600',
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(trend)}%
              </span>
              <span className="text-xs sm:text-sm text-gray-500">vs last month</span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

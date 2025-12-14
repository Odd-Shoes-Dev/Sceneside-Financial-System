'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  ReceiptPercentIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CalendarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  payee: string | null;
  vendor_id: string | null;
  amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  expense_account_id: string;
  payment_account_id: string;
  category: string | null;
  department: string | null;
  project_id: string | null;
  description: string | null;
  receipt_url: string | null;
  is_reimbursable: boolean;
  is_billable: boolean;
  created_at: string;
  vendors?: {
    name: string;
    email: string;
    company_name: string;
    phone: string;
  };
  expense_account?: {
    name: string;
    code: string;
  };
  payment_account?: {
    name: string;
    code: string;
  };
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadExpenseDetails();
    }
  }, [params.id]);

  const loadExpenseDetails = async () => {
    try {
      setLoading(true);

      // Fetch expense with related data
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          vendors (
            name,
            email,
            company_name,
            phone
          ),
          expense_account:expense_account_id (
            name,
            code
          ),
          payment_account:payment_account_id (
            name,
            code
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setExpense(data);
    } catch (error) {
      console.error('Failed to load expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this expense? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/dashboard/expenses');
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      alert(error.message || 'Failed to delete expense');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sceneside-navy"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Expense not found</p>
        <Link href="/dashboard/expenses" className="btn-primary mt-4">
          Back to Expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/expenses"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense #: {expense.expense_number}</h1>
            <p className="text-gray-600">Expense Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary">
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print
          </button>
          
          <Link 
            href={`/dashboard/expenses/${params.id}/edit`}
            className="btn-secondary inline-flex items-center"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Edit
          </Link>
          
          <button 
            onClick={handleDelete} 
            disabled={actionLoading}
            className="btn-secondary text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Expense Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ReceiptPercentIcon className="w-8 h-8 text-sceneside-navy" />
                <h2 className="text-3xl font-bold text-gray-900">EXPENSE</h2>
              </div>
              <p className="text-gray-600">Expense #: {expense.expense_number}</p>
              {expense.reference_number && (
                <p className="text-gray-600">Reference: {expense.reference_number}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(expense.expense_date)}</p>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
          {/* Payee Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4" />
              PAYEE
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">
                {expense.vendors?.company_name || expense.vendors?.name || expense.payee || 'N/A'}
              </p>
              {expense.vendors?.email && (
                <p className="text-sm text-gray-600 mt-1">{expense.vendors.email}</p>
              )}
              {expense.vendors?.phone && (
                <p className="text-sm text-gray-600">{expense.vendors.phone}</p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4" />
              PAYMENT DETAILS
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {expense.payment_method.replace(/_/g, ' ')}
                </span>
              </div>
              {expense.reference_number && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reference:</span>
                  <span className="font-medium text-gray-900">{expense.reference_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{formatDate(expense.expense_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Category */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">DESCRIPTION</h3>
              <p className="text-gray-900">{expense.description || 'No description provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                CATEGORIZATION
              </h3>
              <div className="space-y-2">
                {expense.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {expense.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {expense.department && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="font-medium text-gray-900">{expense.department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">ACCOUNTING DETAILS</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Expense Account</p>
              <p className="font-medium text-gray-900">
                {expense.expense_account?.code} - {expense.expense_account?.name}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Payment Account</p>
              <p className="font-medium text-gray-900">
                {expense.payment_account?.code} - {expense.payment_account?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Amount</span>
                <span className="font-medium">{formatCurrency(expense.amount)}</span>
              </div>
              {parseFloat(expense.tax_amount as any) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span className="font-medium">{formatCurrency(expense.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-gray-900 text-2xl">
                  {formatCurrency(expense.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Flags */}
        {(expense.is_reimbursable || expense.is_billable) && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-4">
              {expense.is_reimbursable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Reimbursable
                </span>
              )}
              {expense.is_billable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Billable to Client
                </span>
              )}
            </div>
          </div>
        )}

        {/* Receipt */}
        {expense.receipt_url && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">RECEIPT</h3>
            <a 
              href={expense.receipt_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sceneside-navy hover:text-sceneside-navy/80 flex items-center gap-2"
            >
              <DocumentTextIcon className="w-5 h-5" />
              View Receipt
            </a>
          </div>
        )}

        {/* Metadata */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            <p>Created: {new Date(expense.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

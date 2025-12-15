'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency as currencyFormatter, SupportedCurrency } from '@/lib/currency';
import {
  ArrowLeftIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

interface Bill {
  id: string;
  bill_number: string;
  total: number;
  amount_paid: number;
  status: string;
  currency?: SupportedCurrency;
  vendor: {
    name: string;
  } | null;
}

export default function RecordBillPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchBill();
  }, [params.id]);

  const fetchBill = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          total,
          amount_paid,
          status,
          vendor:vendors(name)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;

      const vendorData = (data as any).vendor;
      setBill({
        id: data.id,
        bill_number: data.bill_number,
        total: parseFloat(data.total as any),
        amount_paid: parseFloat(data.amount_paid as any),
        status: data.status,
        vendor: Array.isArray(vendorData)
          ? vendorData[0] ?? null
          : vendorData ?? null,
      });

      // Pre-fill with balance due
      const balanceDue = parseFloat(data.total as any) - parseFloat(data.amount_paid as any);
      setFormData((prev) => ({
        ...prev,
        amount: balanceDue.toFixed(2),
      }));
    } catch (error) {
      console.error('Error fetching bill:', error);
      setError('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const balanceDue = bill!.total - bill!.amount_paid;
      if (amount > balanceDue) {
        throw new Error(`Amount cannot exceed balance due (${formatCurrency(balanceDue)})`);
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: params.id,
          payment_date: formData.payment_date,
          amount: amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
        });

      if (paymentError) throw paymentError;

      // Update bill amount_paid and status
      const newAmountPaid = bill!.amount_paid + amount;
      const newStatus = newAmountPaid >= bill!.total ? 'paid' : 'partial';

      await supabase
        .from('bills')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
        })
        .eq('id', params.id);

      // Create journal entry
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get AP and Cash accounts
        const { data: apAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('code', '2000')
          .single();

        const { data: cashAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('code', '1000')
          .single();

        if (apAccount && cashAccount) {
          // Create journal entry
          const { data: journalEntry } = await supabase
            .from('journal_entries')
            .insert({
              entry_date: formData.payment_date,
              description: `Bill payment - ${bill!.bill_number}`,
              source_module: 'bill_payments',
              created_by: user.id,
            })
            .select()
            .single();

          if (journalEntry) {
            // Create journal entry lines
            await supabase.from('journal_entry_lines').insert([
              {
                journal_entry_id: journalEntry.id,
                account_id: apAccount.id,
                debit_amount: amount,
                credit_amount: 0,
                description: `Payment to ${bill!.vendor?.name ?? 'Vendor'}`,
              },
              {
                journal_entry_id: journalEntry.id,
                account_id: cashAccount.id,
                debit_amount: 0,
                credit_amount: amount,
                description: `Payment to ${bill!.vendor?.name ?? 'Vendor'}`,
              },
            ]);
          }
        }
      }

      router.push(`/dashboard/bills/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return currencyFormatter(amount, bill?.currency || 'USD');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Bill not found</p>
        <Link href="/dashboard/bills" className="btn-primary mt-4">
          Back to Bills
        </Link>
      </div>
    );
  }

  const balanceDue = bill.total - bill.amount_paid;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/bills/${params.id}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
          <p className="text-gray-600">{bill.bill_number}</p>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">Vendor</p>
            <p className="font-medium">{bill.vendor?.name ?? 'Unknown'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bill Number</p>
            <p className="font-medium">{bill.bill_number}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold">{formatCurrency(bill.total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid</p>
            <p className="font-semibold text-green-600">{formatCurrency(bill.amount_paid)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Balance Due</p>
            <p className="font-semibold text-red-600">{formatCurrency(balanceDue)}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Payment Details</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b53b]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDue}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b53b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b53b]"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Check #, transaction ID, etc."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b53b]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional payment notes..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b53b]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2 bg-[#52b53b] text-white rounded-lg text-sm font-medium hover:bg-[#449932] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
            <Link
              href={`/dashboard/bills/${params.id}`}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

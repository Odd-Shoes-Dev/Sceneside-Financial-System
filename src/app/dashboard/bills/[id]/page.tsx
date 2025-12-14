'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  CreditCardIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { printBill } from '@/lib/pdf/bill';

interface BillLine {
  id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  tax_rate: number;
  tax_amount: number;
}

interface Bill {
  id: string;
  bill_number: string;
  vendor_id: string;
  bill_date: string;
  due_date: string;
  vendor_invoice_number: string | null;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  status: string;
  vendors?: {
    name: string;
    email: string;
    company_name: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
}

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadBillDetails();
    }
  }, [params.id]);

  const loadBillDetails = async () => {
    try {
      setLoading(true);

      // Fetch bill with vendor
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select(`
          *,
          vendors (
            name,
            email,
            company_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            country
          )
        `)
        .eq('id', params.id)
        .single();

      if (billError) throw billError;
      setBill(billData);

      // Fetch bill lines
      const { data: linesData, error: linesError } = await supabase
        .from('bill_lines')
        .select('*')
        .eq('bill_id', params.id)
        .order('line_number');

      if (linesError) throw linesError;
      setLines(linesData || []);
    } catch (error) {
      console.error('Failed to load bill:', error);
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'badge-gray',
      pending_approval: 'badge-warning',
      approved: 'badge-info',
      partial: 'badge-info',
      paid: 'badge-success',
      overdue: 'badge-error',
      void: 'badge-gray',
    };
    return styles[status] || 'badge-gray';
  };

  const handlePrint = () => {
    if (bill && lines) {
      printBill({
        bill,
        vendor: bill.vendors || {},
        lines,
      });
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this bill for payment?')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'approved' })
        .eq('id', params.id);

      if (error) throw error;
      
      // Reload bill
      await loadBillDetails();
    } catch (error) {
      console.error('Failed to approve bill:', error);
      alert('Failed to approve bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm('Void this bill? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bills/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      router.push('/dashboard/bills');
    } catch (error: any) {
      console.error('Failed to void bill:', error);
      alert(error.message || 'Failed to void bill');
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this bill? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bills/${params.id}?action=delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      router.push('/dashboard/bills');
    } catch (error: any) {
      console.error('Failed to delete bill:', error);
      alert(error.message || 'Failed to delete bill');
      setActionLoading(false);
    }
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
        <p className="text-gray-600">Bill not found</p>
        <Link href="/dashboard/bills" className="btn-primary mt-4">
          Back to Bills
        </Link>
      </div>
    );
  }

  const balanceDue = parseFloat(bill.total as any) - parseFloat(bill.amount_paid as any);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/bills"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{bill.bill_number}</h1>
            <p className="text-gray-600">Bill Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary">
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print
          </button>
          
          {bill.status === 'draft' && (
            <>
              <Link href={`/dashboard/bills/${params.id}/edit`} className="btn-secondary">
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit
              </Link>
              <button 
                onClick={handleApprove} 
                disabled={actionLoading}
                className="btn-secondary"
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                Approve
              </button>
              <button 
                onClick={handleDelete} 
                disabled={actionLoading}
                className="btn-secondary text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete
              </button>
            </>
          )}

          {['approved', 'partial', 'overdue'].includes(bill.status) && balanceDue > 0 && (
            <>
              <Link href={`/dashboard/bills/${params.id}/payment`} className="btn-primary">
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Record Payment
              </Link>
              <button 
                onClick={handleVoid} 
                disabled={actionLoading}
                className="btn-secondary text-red-600 hover:bg-red-50"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Void
              </button>
            </>
          )}

          {bill.status === 'paid' && (
            <button 
              onClick={handleVoid} 
              disabled={actionLoading}
              className="btn-secondary text-red-600 hover:bg-red-50"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              Void
            </button>
          )}
        </div>
      </div>

      {/* Bill Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">BILL</h2>
              <p className="text-gray-600">Bill #: {bill.bill_number}</p>
              {bill.vendor_invoice_number && (
                <p className="text-gray-600">Vendor Invoice: {bill.vendor_invoice_number}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`badge ${getStatusBadge(bill.status)} text-lg px-4 py-2`}>
                {bill.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Vendor & Date Info */}
        <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">VENDOR</h3>
            <p className="font-medium text-gray-900">
              {bill.vendors?.company_name || bill.vendors?.name}
            </p>
            {(bill.vendors?.address_line1 || bill.vendors?.city) && (
              <div className="text-sm text-gray-600 mt-1">
                {bill.vendors.address_line1 && <p>{bill.vendors.address_line1}</p>}
                {bill.vendors.address_line2 && <p>{bill.vendors.address_line2}</p>}
                {(bill.vendors.city || bill.vendors.state || bill.vendors.zip_code) && (
                  <p>
                    {bill.vendors.city}{bill.vendors.city && bill.vendors.state ? ', ' : ''}{bill.vendors.state} {bill.vendors.zip_code}
                  </p>
                )}
                {bill.vendors.country && bill.vendors.country !== 'USA' && (
                  <p>{bill.vendors.country}</p>
                )}
              </div>
            )}
            {bill.vendors?.email && (
              <p className="text-sm text-gray-600">{bill.vendors.email}</p>
            )}
            {bill.vendors?.phone && (
              <p className="text-sm text-gray-600">{bill.vendors.phone}</p>
            )}
          </div>
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bill Date</p>
                <p className="font-medium">{formatDate(bill.bill_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{formatDate(bill.due_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{line.description}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {parseFloat(line.quantity as any)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(line.unit_cost)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(line.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
              </div>
              {parseFloat(bill.tax_amount as any) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(bill.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {formatCurrency(bill.total)}
                </span>
              </div>
              {parseFloat(bill.amount_paid as any) > 0 && (
                <div className="flex justify-between text-[#52b53b]">
                  <span>Paid</span>
                  <span>-{formatCurrency(bill.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-bold text-gray-900">Balance Due</span>
                <span className="font-bold text-gray-900 text-xl">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {bill.notes && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">NOTES</h3>
            <p className="text-gray-600 whitespace-pre-line">{bill.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button, Card, CardHeader, CardTitle, CardBody, Badge, LoadingSpinner } from '@/components/ui';
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilIcon,
  EnvelopeIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  po_number: string | null;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };
}

interface LineItem {
  id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  inventory_item_id: string | null;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      // Fetch invoice with customer
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', params.id)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch line items
      const { data: itemsData } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', params.id)
        .order('line_number');

      setLineItems(itemsData || []);

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', params.id)
        .order('payment_date', { ascending: false });

      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching invoice:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      draft: 'default',
      sent: 'info',
      partial: 'warning',
      paid: 'success',
      overdue: 'error',
      cancelled: 'default',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handlePrint = () => {
    window.open(`/api/invoices/${params.id}/pdf`, '_blank');
  };

  const handleMarkAsSent = async () => {
    setActionLoading('send');
    try {
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', params.id);
      
      fetchInvoice();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    setActionLoading('delete');
    try {
      await supabase
        .from('invoices')
        .delete()
        .eq('id', params.id);
      
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setActionLoading(null);
    }
  };

  const handleCopyPaymentLink = () => {
    const paymentUrl = `${window.location.origin}/pay?invoice=${params.id}`;
    navigator.clipboard.writeText(paymentUrl);
    alert('Payment link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Link href="/dashboard/invoices">
          <Button variant="outline" className="mt-4">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const balanceDue = Number(invoice.total_amount) - Number(invoice.amount_paid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice {invoice.invoice_number}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-500 mt-1">
              {invoice.customer?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
          
          {invoice.status === 'draft' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAsSent}
              disabled={actionLoading === 'send'}
            >
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Mark as Sent
            </Button>
          )}
          
          {balanceDue > 0 && invoice.status !== 'draft' && (
            <Button variant="outline" size="sm" onClick={handleCopyPaymentLink}>
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Copy Payment Link
            </Button>
          )}
          
          <Link href={`/dashboard/invoices/${params.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
            className="text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice Date</p>
                  <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PO Number</p>
                  <p className="font-medium">{invoice.po_number || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{invoice.status}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">#</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Qty</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Unit Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-2 text-gray-500">{item.line_number}</td>
                        <td className="py-3 px-2">{item.description}</td>
                        <td className="py-3 px-2 text-right">{item.quantity}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">-{formatCurrency(Number(invoice.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                  <span>{formatCurrency(Number(invoice.tax_amount))}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(Number(invoice.total_amount))}</span>
                </div>
                {Number(invoice.amount_paid) > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Amount Paid</span>
                      <span>-{formatCurrency(Number(invoice.amount_paid))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-red-600">
                      <span>Balance Due</span>
                      <span>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <p className="font-medium">{invoice.customer?.name}</p>
                {invoice.customer?.email && (
                  <p className="text-sm text-gray-500">{invoice.customer.email}</p>
                )}
                {invoice.customer?.phone && (
                  <p className="text-sm text-gray-500">{invoice.customer.phone}</p>
                )}
                {invoice.customer?.address && (
                  <p className="text-sm text-gray-500 mt-2">
                    {invoice.customer.address}
                    {invoice.customer.city && <br />}
                    {[invoice.customer.city, invoice.customer.state, invoice.customer.zip_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <Link href={`/dashboard/customers/${invoice.customer_id}`}>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  View Customer
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium">{formatCurrency(Number(invoice.total_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(Number(invoice.amount_paid))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Balance Due</span>
                  <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {balanceDue > 0 && invoice.status !== 'draft' && (
                <Link href={`/dashboard/invoices/${params.id}/payment`}>
                  <Button className="w-full mt-4">
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </Link>
              )}

              {balanceDue === 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Paid in Full</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-sm text-gray-500">{formatDate(payment.payment_date)}</p>
                        <p className="text-xs text-gray-400 capitalize">{payment.payment_method.replace('_', ' ')}</p>
                      </div>
                      {payment.reference_number && (
                        <span className="text-xs text-gray-500">#{payment.reference_number}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

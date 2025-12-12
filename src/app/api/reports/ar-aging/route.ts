import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/reports/ar-aging - Accounts Receivable Aging
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];
    const customerId = searchParams.get('customer_id');

    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total,
        amount_paid,
        status,
        customers (id, name, email)
      `)
      .in('status', ['sent', 'partial', 'overdue'])
      .lte('invoice_date', asOfDate);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: invoices, error } = await query.order('due_date');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const today = new Date(asOfDate);
    
    // Initialize aging buckets
    const aging = {
      current: { count: 0, total: 0, invoices: [] as any[] },
      days1to30: { count: 0, total: 0, invoices: [] as any[] },
      days31to60: { count: 0, total: 0, invoices: [] as any[] },
      days61to90: { count: 0, total: 0, invoices: [] as any[] },
      over90: { count: 0, total: 0, invoices: [] as any[] },
    };

    // Customer summaries
    const customerAging: Record<string, {
      customer: any;
      current: number;
      days1to30: number;
      days31to60: number;
      days61to90: number;
      over90: number;
      total: number;
    }> = {};

    invoices?.forEach((invoice: any) => {
      const balance = invoice.total - invoice.amount_paid;
      if (balance <= 0) return;

      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const invoiceData = {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total: invoice.total,
        balance,
        days_overdue: Math.max(0, daysOverdue),
        customer: invoice.customers,
      };

      // Determine bucket
      let bucket: keyof typeof aging;
      if (daysOverdue <= 0) {
        bucket = 'current';
      } else if (daysOverdue <= 30) {
        bucket = 'days1to30';
      } else if (daysOverdue <= 60) {
        bucket = 'days31to60';
      } else if (daysOverdue <= 90) {
        bucket = 'days61to90';
      } else {
        bucket = 'over90';
      }

      aging[bucket].count++;
      aging[bucket].total += balance;
      aging[bucket].invoices.push(invoiceData);

      // Update customer summary
      const custId = invoice.customers?.id;
      if (custId) {
        if (!customerAging[custId]) {
          customerAging[custId] = {
            customer: invoice.customers,
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            over90: 0,
            total: 0,
          };
        }
        customerAging[custId][bucket] += balance;
        customerAging[custId].total += balance;
      }
    });

    const totalOutstanding = 
      aging.current.total + 
      aging.days1to30.total + 
      aging.days31to60.total + 
      aging.days61to90.total + 
      aging.over90.total;

    return NextResponse.json({
      data: {
        asOfDate,
        summary: {
          current: aging.current.total,
          days1to30: aging.days1to30.total,
          days31to60: aging.days31to60.total,
          days61to90: aging.days61to90.total,
          over90: aging.over90.total,
          total: totalOutstanding,
        },
        aging,
        byCustomer: Object.values(customerAging).sort((a, b) => b.total - a.total),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

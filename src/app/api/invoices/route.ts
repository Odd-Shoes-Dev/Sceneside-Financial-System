import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name, email)
      `, { count: 'exact' })
      .order('invoice_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.customer_id || !body.invoice_date || !body.due_date) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, invoice_date, due_date' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate invoice number
    const { data: invoiceNumber, error: numError } = await supabase.rpc('generate_invoice_number');
    if (numError) {
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Get AR account
    const { data: arAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', '1200')
      .single();

    // Calculate totals from lines
    const lines = body.lines || [];
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    lines.forEach((line: any) => {
      const lineSubtotal = line.quantity * line.unit_price;
      const lineDiscount = lineSubtotal * ((line.discount_percent || 0) / 100);
      const lineNet = lineSubtotal - lineDiscount;
      const lineTax = lineNet * (line.tax_rate || 0);

      subtotal += lineNet;
      taxAmount += lineTax;
      discountAmount += lineDiscount;
    });

    const total = subtotal + taxAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: body.customer_id,
        invoice_date: body.invoice_date,
        due_date: body.due_date,
        payment_terms: body.payment_terms || 30,
        po_number: body.po_number || null,
        notes: body.notes || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
        amount_paid: 0,
        status: body.status || 'draft',
        ar_account_id: arAccount?.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 400 });
    }

    // Create invoice lines
    if (lines.length > 0) {
      const invoiceLines = lines.map((line: any, index: number) => {
        const lineSubtotal = line.quantity * line.unit_price;
        const lineDiscount = lineSubtotal * ((line.discount_percent || 0) / 100);
        const lineNet = lineSubtotal - lineDiscount;
        const lineTax = lineNet * (line.tax_rate || 0);

        return {
          invoice_id: invoice.id,
          line_number: index + 1,
          product_id: line.product_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent || 0,
          discount_amount: lineDiscount,
          tax_rate: line.tax_rate || 0,
          tax_amount: lineTax,
          line_total: lineNet,
        };
      });

      const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(invoiceLines);

      if (linesError) {
        // Rollback invoice if lines fail
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return NextResponse.json({ error: linesError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

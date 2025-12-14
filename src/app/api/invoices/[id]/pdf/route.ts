import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest, context: any) {
  const { params } = context || {};
  try {
    // Create service-role Supabase client on demand so builds without service keys don't
    // crash during module evaluation. If the key is missing, return a clear error.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey);
    const invoiceId = params.id;

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Fetch customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', invoice.customer_id)
      .single();

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_number');

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, customer, lineItems || []);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateInvoiceHTML(invoice: any, customer: any, lineItems: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          color: #333;
          line-height: 1.5;
          background: white;
        }
        .invoice {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1e3a5f;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .company-name {
          font-size: 28px;
          font-weight: 700;
          color: #1e3a5f;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          font-size: 36px;
          color: #1e3a5f;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .invoice-number {
          font-size: 18px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-sent { background: #dbeafe; color: #1d4ed8; }
        .status-partial { background: #fef3c7; color: #d97706; }
        .status-paid { background: #d1fae5; color: #059669; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        .status-cancelled { background: #f3f4f6; color: #6b7280; }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .info-block {
          flex: 1;
        }
        .info-block h3 {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .info-block p {
          margin-bottom: 4px;
        }
        .info-block strong {
          color: #1e3a5f;
          font-size: 16px;
        }
        .dates-block {
          text-align: right;
        }
        .date-row {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          margin-bottom: 8px;
        }
        .date-row .label {
          color: #666;
          font-weight: 500;
        }
        .date-row .value {
          min-width: 120px;
          text-align: right;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th {
          background: linear-gradient(135deg, #1e3a5f 0%, #6b2d7b 100%);
          color: white;
          padding: 14px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .items-table th:first-child {
          border-radius: 8px 0 0 0;
        }
        .items-table th:last-child {
          border-radius: 0 8px 0 0;
          text-align: right;
        }
        .items-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table td:last-child {
          text-align: right;
        }
        .items-table tbody tr:hover {
          background: #f9fafb;
        }
        .items-table tbody tr:last-child td:first-child {
          border-radius: 0 0 0 8px;
        }
        .items-table tbody tr:last-child td:last-child {
          border-radius: 0 0 8px 0;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-table {
          width: 320px;
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-row:last-child {
          border-bottom: none;
        }
        .totals-row.grand-total {
          font-size: 20px;
          font-weight: 700;
          color: #1e3a5f;
          border-top: 2px solid #1e3a5f;
          border-bottom: none;
          padding-top: 15px;
          margin-top: 5px;
        }
        .payment-info {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 30px;
          border-left: 4px solid #1e3a5f;
        }
        .payment-info h3 {
          font-size: 14px;
          color: #1e3a5f;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .payment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .payment-item .label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-item .value {
          font-weight: 600;
          color: #1e3a5f;
          margin-top: 4px;
        }
        .notes {
          background: #fffbeb;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          margin-bottom: 30px;
        }
        .notes h3 {
          font-size: 14px;
          color: #92400e;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .notes p {
          color: #78350f;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #9ca3af;
          font-size: 12px;
        }
        .footer .thanks {
          font-size: 18px;
          color: #1e3a5f;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #1e3a5f;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .print-btn:hover {
          background: #2d4a6f;
        }
        @media print {
          .print-btn { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .invoice { padding: 20px; max-width: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Print / Save PDF
      </button>
      
      <div class="invoice">
        <div class="header">
          <div class="logo-section">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #1e3a5f 0%, #c41e7f 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
            </div>
            <span class="company-name">Sceneside L.L.C</span>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p class="invoice-number">#${invoice.invoice_number}</p>
            <span class="status-badge status-${invoice.status}">${invoice.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-block">
            <h3>Bill To</h3>
            <p><strong>${customer?.name || 'Customer'}</strong></p>
            ${customer?.address ? `<p>${customer.address}</p>` : ''}
            ${customer?.city || customer?.state || customer?.zip_code ? 
              `<p>${[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}</p>` : ''}
            ${customer?.email ? `<p>${customer.email}</p>` : ''}
            ${customer?.phone ? `<p>${customer.phone}</p>` : ''}
          </div>
          
          <div class="info-block">
            <h3>From</h3>
            <p><strong>Sceneside L.L.C</strong></p>
            <p>121 Bedford Street</p>
            <p>Waltham, MA 02453</p>
            <p>857-384-2899</p>
          </div>

          <div class="info-block dates-block">
            <div class="date-row">
              <span class="label">Invoice Date:</span>
              <span class="value">${formatDate(invoice.invoice_date)}</span>
            </div>
            <div class="date-row">
              <span class="label">Due Date:</span>
              <span class="value">${formatDate(invoice.due_date)}</span>
            </div>
            ${invoice.po_number ? `
            <div class="date-row">
              <span class="label">PO Number:</span>
              <span class="value">${invoice.po_number}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 45%">Description</th>
              <th style="width: 15%">Qty</th>
              <th style="width: 20%">Unit Price</th>
              <th style="width: 20%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(Number(item.unit_price))}</td>
                <td>${formatCurrency(Number(item.amount))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            ${Number(invoice.discount_amount) > 0 ? `
            <div class="totals-row">
              <span>Discount</span>
              <span style="color: #059669;">-${formatCurrency(Number(invoice.discount_amount))}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Tax (${invoice.tax_rate || 0}%)</span>
              <span>${formatCurrency(Number(invoice.tax_amount))}</span>
            </div>
            <div class="totals-row grand-total">
              <span>Total</span>
              <span>${formatCurrency(Number(invoice.total_amount))}</span>
            </div>
            ${Number(invoice.amount_paid) > 0 ? `
            <div class="totals-row" style="color: #059669;">
              <span>Paid</span>
              <span>-${formatCurrency(Number(invoice.amount_paid))}</span>
            </div>
            <div class="totals-row" style="font-weight: 700; font-size: 16px; color: #dc2626;">
              <span>Balance Due</span>
              <span>${formatCurrency(Number(invoice.total_amount) - Number(invoice.amount_paid))}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="payment-info">
          <h3>Payment Information</h3>
          <div class="payment-grid">
            <div class="payment-item">
              <div class="label">Bank</div>
              <div class="value">Bank of America</div>
            </div>
            <div class="payment-item">
              <div class="label">Account Number</div>
              <div class="value">466021944682</div>
            </div>
            <div class="payment-item">
              <div class="label">EIN</div>
              <div class="value">99-3334108</div>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p class="thanks">Thank you for your business!</p>
          <p>Sceneside L.L.C • 121 Bedford Street, Waltham, MA 02453 • 857-384-2899</p>
          <p style="margin-top: 8px;">Questions? Contact us at accounts@sceneside.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

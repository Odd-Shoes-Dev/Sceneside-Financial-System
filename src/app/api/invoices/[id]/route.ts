import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceInventory, reverseInvoiceInventory } from '@/lib/accounting/inventory';

// GET /api/invoices/[id] - Get single invoice with lines
export async function GET(request: NextRequest, context: any) {
  const { params } = context || {};
  try {
    const supabase = await createClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (id, name, email, phone, address_line1, address_line2, city, state, zip_code),
        invoice_lines (*, products (id, name, sku))
      `)
      .eq('id', params.id)
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get payments
    const { data: payments } = await supabase
      .from('payment_applications')
      .select(`
        amount_applied,
        payments_received (
          id,
          payment_date,
          amount,
          payment_method,
          reference_number,
          notes
        )
      `)
      .eq('invoice_id', params.id)
      .order('payments_received.payment_date', { ascending: false });

    return NextResponse.json({
      data: {
        ...invoice,
        payments: payments || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(request: NextRequest, context: any) {
  const { params } = context || {};
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get user for inventory operations
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing invoice with lines
    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_lines(*)')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Prevent editing paid/void invoices
    if (['paid', 'void'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot edit paid or voided invoices' },
        { status: 400 }
      );
    }

    // Check if status is changing from draft to sent/paid (invoice is being finalized)
    const isBeingFinalized = existing.status === 'draft' && 
      body.status && ['sent', 'paid', 'overdue'].includes(body.status);

    // Update invoice
    const updateData: any = {};
    const allowedFields = [
      'customer_id', 'invoice_date', 'due_date', 'payment_terms',
      'po_number', 'notes', 'status'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // If lines are provided, update them
    if (body.lines) {
      // Delete existing lines
      await supabase.from('invoice_lines').delete().eq('invoice_id', params.id);

      // Calculate new totals
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      const invoiceLines = body.lines.map((line: any, index: number) => {
        const lineSubtotal = line.quantity * line.unit_price;
        const lineDiscount = lineSubtotal * ((line.discount_percent || 0) / 100);
        const lineNet = lineSubtotal - lineDiscount;
        const lineTax = lineNet * (line.tax_rate || 0);

        subtotal += lineNet;
        taxAmount += lineTax;
        discountAmount += lineDiscount;

        return {
          invoice_id: params.id,
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

      // Insert new lines
      await supabase.from('invoice_lines').insert(invoiceLines);

      // Update invoice totals
      const total = subtotal + taxAmount;
      await supabase
        .from('invoices')
        .update({
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total,
        })
        .eq('id', params.id);
    }

    // Process inventory when invoice is finalized (status changes from draft)
    if (isBeingFinalized) {
      try {
        const linesToProcess = body.lines || existing.invoice_lines;
        const inventoryResult = await processInvoiceInventory(
          params.id,
          linesToProcess.map((line: any) => ({
            product_id: line.product_id,
            quantity: line.quantity,
            description: line.description,
          })),
          existing.customer_id,
          user.id
        );

        // Return inventory processing info with the response
        return NextResponse.json({ 
          data: invoice,
          inventory: {
            processed: true,
            itemsConsumed: inventoryResult.consumptions.length,
            totalCost: inventoryResult.totalCost,
            journalEntryId: inventoryResult.journalEntryId,
          }
        });
      } catch (inventoryError: any) {
        console.error('Inventory processing error:', inventoryError);
        // Invoice was updated, but log the inventory error
        return NextResponse.json({ 
          data: invoice,
          inventory: {
            processed: false,
            error: inventoryError.message,
          }
        });
      }
    }

    return NextResponse.json({ data: invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete or void invoice
export async function DELETE(request: NextRequest, context: any) {
  const { params } = context || {};
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'void';

    // Get user for inventory operations
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing invoice
    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('status, amount_paid')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status === 'void') {
      return NextResponse.json({ error: 'Invoice is already voided' }, { status: 400 });
    }

    if (action === 'delete') {
      // Only allow delete for drafts with no payments
      if (existing.status !== 'draft' || existing.amount_paid > 0) {
        return NextResponse.json(
          { error: 'Can only delete draft invoices with no payments' },
          { status: 400 }
        );
      }

      // Delete lines first
      await supabase.from('invoice_lines').delete().eq('invoice_id', params.id);
      
      // Delete invoice
      const { error } = await supabase.from('invoices').delete().eq('id', params.id);
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: 'Invoice deleted' });
    } else {
      // Void the invoice
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'void' })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Reverse inventory consumption if invoice was not a draft
      let inventoryReversed = false;
      let reversalJournalEntryId: string | undefined;
      
      if (existing.status !== 'draft') {
        try {
          const reversalResult = await reverseInvoiceInventory(params.id, user.id);
          inventoryReversed = reversalResult.success;
          reversalJournalEntryId = reversalResult.journalEntryId;
        } catch (inventoryError: any) {
          console.error('Inventory reversal error:', inventoryError);
        }
      }

      return NextResponse.json({ 
        data, 
        message: 'Invoice voided',
        inventory: {
          reversed: inventoryReversed,
          journalEntryId: reversalJournalEntryId,
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

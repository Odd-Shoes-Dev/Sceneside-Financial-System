import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { processBillInventory, reverseBillInventory } from '@/lib/accounting/inventory';

// GET /api/bills/[id] - Get single bill
export async function GET(request: NextRequest, context: any) {
  const { params } = context || {};
  const resolvedParams = await params;
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        vendors (id, name, company_name, email, phone, address_line1, address_line2, city, state, zip_code, country)
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/bills/[id] - Update bill
export async function PATCH(request: NextRequest, context: any) {
  const { params } = context || {};
  const resolvedParams = await params;
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get existing bill
    const { data: existing, error: fetchError } = await supabase
      .from('bills')
      .select('status, bill_date')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Prevent editing paid/void bills
    if (['paid', 'void'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot edit paid or voided bills' },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get account IDs from codes if needed
    const lines = body.line_items || body.lines || [];
    const accountCodes = lines
      .map((line: any) => line.account_code)
      .filter((code: any) => code);
    
    let accountMap: Record<string, string> = {};
    if (accountCodes.length > 0) {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, code')
        .in('code', accountCodes);
      
      if (accounts) {
        accountMap = Object.fromEntries(
          accounts.map((acc: any) => [acc.code, acc.id])
        );
      }
    }

    // Update bill - start with empty update object
    const updateData: any = {};

    // Only recalculate totals if line items are provided in the request
    if (lines.length > 0) {
      let subtotal = 0;
      let taxAmount = 0;

      lines.forEach((line: any) => {
        const unitCost = line.unit_cost || line.unit_price || 0;
        const lineSubtotal = line.quantity * unitCost;
        const lineTax = lineSubtotal * (line.tax_rate || 0);
        subtotal += lineSubtotal;
        taxAmount += lineTax;
      });

      const total = subtotal + taxAmount;

      // Add totals to update data only if we have lines
      updateData.subtotal = subtotal;
      updateData.tax_amount = taxAmount;
      updateData.total = total;
    }

    const allowedFields = [
      'vendor_id', 'bill_date', 'due_date', 'vendor_invoice_number', 'notes', 'status'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: bill, error: updateError } = await supabase
      .from('bills')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // If lines are provided, update them
    if (lines.length > 0) {
      // Delete existing lines
      await supabase.from('bill_lines').delete().eq('bill_id', resolvedParams.id);

      // Create new lines
      const billLines = lines
        .filter((line: any) => {
          const unitCost = line.unit_cost || line.unit_price || 0;
          const hasDescription = line.description && line.description.trim();
          return hasDescription && (line.quantity * unitCost) > 0;
        })
        .map((line: any, index: number) => {
          const unitCost = line.unit_cost || line.unit_price || 0;
          const expenseAccountId = line.expense_account_id || (line.account_code ? accountMap[line.account_code] : null);
          return {
            bill_id: bill.id,
            line_number: index + 1,
            expense_account_id: expenseAccountId,
            product_id: line.product_id || null,
            project_id: line.project_id || null,
            department: line.department || null,
            description: line.description || '',
            quantity: line.quantity,
            unit_cost: unitCost,
            tax_rate: line.tax_rate || 0,
            tax_amount: line.quantity * unitCost * (line.tax_rate || 0),
            line_total: line.quantity * unitCost,
          };
        });

      if (billLines.length > 0) {
        const { error: linesError } = await supabase
          .from('bill_lines')
          .insert(billLines);

        if (linesError) {
          return NextResponse.json({ error: linesError.message }, { status: 400 });
        }
      }
    }

    // Check if bill is being approved (status change from draft to approved)
    const isBeingApproved = 
      existing.status === 'draft' && 
      body.status === 'approved';

    console.log('🔍 Approval check:', { 
      existingStatus: existing.status, 
      newStatus: body.status, 
      isBeingApproved 
    });

    if (isBeingApproved) {
      console.log('🔄 Bill being approved, fetching lines...');
      // Fetch bill lines from database to process inventory
      const { data: billLines, error: linesError } = await supabase
        .from('bill_lines')
        .select('*')
        .eq('bill_id', resolvedParams.id);

      console.log('📦 Bill lines fetched:', billLines?.length || 0, 'lines');
      console.log('📋 Bill lines data:', JSON.stringify(billLines, null, 2));
      
      if (linesError) {
        console.error('❌ Error fetching bill lines:', linesError);
      }

      if (billLines && billLines.length > 0) {
        const linesWithProducts = billLines.filter(l => l.product_id);
        console.log('📋 Lines with products:', linesWithProducts.length);
        console.log('📋 Product IDs:', linesWithProducts.map(l => l.product_id));
        
        // Process inventory for approved bills (receive inventory)
        try {
          const inventoryResult = await processBillInventory(
            resolvedParams.id,
            billLines.map((line: any) => ({
              product_id: line.product_id || null,
              quantity: line.quantity || 0,
              unit_cost: line.unit_cost || 0,
              description: line.description || '',
            })),
            body.bill_date || existing.bill_date,
            user.id,
            supabase
          );

          console.log('✅ Inventory received:', JSON.stringify(inventoryResult, null, 2));
        } catch (error) {
          console.error('❌ Failed to process bill inventory:', error);
          console.error('❌ Error stack:', error);
          // Don't fail the whole request, just log the error
        }
      } else {
        console.log('⚠️ No bill lines found to process');
      }
    } else {
      console.log('⏭️ Not an approval action, skipping inventory processing');
    }

    return NextResponse.json({ data: bill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bills/[id] - Delete or void bill
export async function DELETE(request: NextRequest, context: any) {
  const { params } = context || {};
  const resolvedParams = await params;
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'void';

    // Get existing bill
    const { data: existing, error: fetchError } = await supabase
      .from('bills')
      .select('status, amount_paid')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (existing.status === 'void') {
      return NextResponse.json({ error: 'Bill is already voided' }, { status: 400 });
    }

    if (action === 'delete') {
      // Only allow delete for drafts with no payments
      if (existing.status !== 'draft' || existing.amount_paid > 0) {
        return NextResponse.json(
          { error: 'Can only delete draft bills with no payments' },
          { status: 400 }
        );
      }

      // Delete lines first
      await supabase.from('bill_lines').delete().eq('bill_id', resolvedParams.id);
      
      // Delete bill
      const { error } = await supabase.from('bills').delete().eq('id', resolvedParams.id);
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: 'Bill deleted' });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Void the bill
      const { data, error } = await supabase
        .from('bills')
        .update({ status: 'void' })
        .eq('id', resolvedParams.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Reverse inventory if this was an approved bill
      let inventoryReversed = false;
      let reversalJournalEntryId: string | undefined;
      
      if (existing.status === 'approved') {
        console.log('🔄 Voiding approved bill, reversing inventory:', resolvedParams.id);
        try {
          const reversalResult = await reverseBillInventory(resolvedParams.id, user.id, supabase);
          inventoryReversed = reversalResult.reversed;
          reversalJournalEntryId = reversalResult.journalEntryId;
          console.log('✅ Inventory reversed for voided bill:', resolvedParams.id, reversalResult);
        } catch (error: any) {
          console.error('❌ Failed to reverse bill inventory:', error);
          // Don't fail the whole request, just log the error
        }
      }

      return NextResponse.json({ 
        data,
        message: 'Bill voided',
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

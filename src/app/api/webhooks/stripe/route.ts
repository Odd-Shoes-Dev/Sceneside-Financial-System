import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoice_id;

        if (invoiceId) {
          // Fetch the invoice
          const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

          if (invoice) {
            const paymentAmount = paymentIntent.amount / 100; // Convert from cents
            const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
            const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial';

            // Update invoice
            await supabase
              .from('invoices')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                paid_date: newStatus === 'paid' ? new Date().toISOString() : null,
              })
              .eq('id', invoiceId);

            // Create payment record
            await supabase.from('invoice_payments').insert([
              {
                invoice_id: invoiceId,
                amount: paymentAmount,
                payment_date: new Date().toISOString(),
                payment_method: 'stripe',
                reference: paymentIntent.id,
                notes: `Stripe payment: ${paymentIntent.id}`,
              },
            ]);

            // Create journal entry for the payment
            const { data: journalEntry } = await supabase
              .from('journal_entries')
              .insert([
                {
                  entry_date: new Date().toISOString().split('T')[0],
                  description: `Payment received for Invoice ${invoice.invoice_number}`,
                  reference: paymentIntent.id,
                  source: 'stripe_payment',
                  source_id: invoiceId,
                  is_posted: true,
                },
              ])
              .select()
              .single();

            if (journalEntry) {
              // Debit Cash/Bank, Credit Accounts Receivable
              await supabase.from('journal_entry_lines').insert([
                {
                  journal_entry_id: journalEntry.id,
                  account_id: '1010', // Cash account
                  debit_amount: paymentAmount,
                  credit_amount: 0,
                  description: 'Payment received',
                },
                {
                  journal_entry_id: journalEntry.id,
                  account_id: '1200', // Accounts Receivable
                  debit_amount: 0,
                  credit_amount: paymentAmount,
                  description: 'Payment received',
                },
              ]);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoice_id;

        if (invoiceId) {
          // Log the failed payment attempt
          console.log(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`);
          
          // You could update the invoice with a failed payment note
          // or send a notification to the business owner
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId && session.payment_status === 'paid') {
          // Similar logic to payment_intent.succeeded
          const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

          if (invoice) {
            const paymentAmount = (session.amount_total || 0) / 100;
            const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
            const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial';

            await supabase
              .from('invoices')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                paid_date: newStatus === 'paid' ? new Date().toISOString() : null,
              })
              .eq('id', invoiceId);

            await supabase.from('invoice_payments').insert([
              {
                invoice_id: invoiceId,
                amount: paymentAmount,
                payment_date: new Date().toISOString(),
                payment_method: 'stripe',
                reference: session.payment_intent as string,
                notes: `Stripe checkout: ${session.id}`,
              },
            ]);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Find invoice with this payment intent
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (invoice) {
          const refundAmount = (charge.amount_refunded || 0) / 100;
          const newAmountPaid = Math.max(0, (invoice.amount_paid || 0) - refundAmount);
          const newStatus = newAmountPaid === 0 ? 'sent' : newAmountPaid < invoice.total ? 'partial' : 'paid';

          await supabase
            .from('invoices')
            .update({
              amount_paid: newAmountPaid,
              status: newStatus,
            })
            .eq('id', invoice.id);

          // Create refund record
          await supabase.from('invoice_payments').insert([
            {
              invoice_id: invoice.id,
              amount: -refundAmount, // Negative for refund
              payment_date: new Date().toISOString(),
              payment_method: 'stripe_refund',
              reference: charge.id,
              notes: `Refund: ${charge.id}`,
            },
          ]);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing, we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

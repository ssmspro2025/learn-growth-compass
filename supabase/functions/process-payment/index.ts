import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      invoiceId,
      studentId,
      centerId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
    } = await req.json();

    if (!invoiceId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid invoice or amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invoice not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if amount exceeds remaining balance
    const remainingBalance = invoice.remaining_amount;
    if (amount > remainingBalance) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment amount exceeds remaining balance of ${remainingBalance}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        center_id: centerId,
        student_id: studentId,
        invoice_id: invoiceId,
        reference_number: referenceNumber,
        payment_date: new Date().toISOString().split('T')[0],
        amount: amount,
        payment_method: paymentMethod,
        payment_status: 'completed',
        notes: notes,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update invoice
    const newPaidAmount = invoice.paid_amount + amount;
    const newRemainingAmount = remainingBalance - amount;
    let newStatus = invoice.status;

    if (newRemainingAmount === 0) {
      newStatus = 'paid';
    } else if (newRemainingAmount < invoice.total_amount) {
      newStatus = 'partial';
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    // Create ledger entry
    await supabase.from('ledger_entries').insert({
      center_id: centerId,
      student_id: studentId,
      entry_type: 'payment',
      reference_id: payment.id,
      reference_table: 'payments',
      amount: amount,
      entry_date: new Date().toISOString().split('T')[0],
      description: `Payment received - Ref: ${referenceNumber || 'N/A'}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment,
        invoice: {
          id: invoiceId,
          status: newStatus,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

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
    const { centerId, month, year } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active students in the center
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, center_id')
      .eq('center_id', centerId);

    if (studentsError) throw studentsError;

    const invoiceDate = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);
    const invoiceNumber = `INV-${centerId.slice(0, 8)}-${year}${String(month).padStart(2, '0')}-`;
    
    let invoicesGenerated = 0;
    const errors: string[] = [];

    for (let i = 0; i < students!.length; i++) {
      const student = students![i];

      try {
        // Get student's fee structure
        const { data: feeAssignment, error: assignmentError } = await supabase
          .from('student_fee_assignments')
          .select('fee_structure_id')
          .eq('student_id', student.id)
          .single();

        if (assignmentError) {
          errors.push(`No fee structure for student ${student.id}`);
          continue;
        }

        // Get fee structure items
        const { data: feeItems, error: itemsError } = await supabase
          .from('fee_structure_items')
          .select('id, fee_heading_id, amount')
          .eq('fee_structure_id', feeAssignment.fee_structure_id)
          .eq('is_active', true);

        if (itemsError) throw itemsError;

        let totalAmount = 0;
        feeItems!.forEach((item: any) => {
          totalAmount += parseFloat(item.amount);
        });

        // Check for custom fees
        const { data: customFees, error: customError } = await supabase
          .from('student_custom_fees')
          .select('amount')
          .eq('student_id', student.id)
          .eq('is_active', true)
          .lte('effective_from', invoiceDate.toISOString().split('T')[0]);

        if (!customError && customFees) {
          customFees.forEach((fee: any) => {
            totalAmount += parseFloat(fee.amount);
          });
        }

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            center_id: centerId,
            student_id: student.id,
            invoice_number: invoiceNumber + String(i + 1).padStart(5, '0'),
            invoice_date: invoiceDate.toISOString().split('T')[0],
            due_date: new Date(year, month, 10).toISOString().split('T')[0],
            status: 'due',
            total_amount: totalAmount,
            remaining_amount: totalAmount,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Create invoice items
        const invoiceItemsToInsert = feeItems!.map((item: any) => ({
          invoice_id: invoice.id,
          fee_heading_id: item.fee_heading_id,
          amount: item.amount,
        }));

        if (invoiceItemsToInsert.length > 0) {
          const { error: itemInsertError } = await supabase
            .from('invoice_items')
            .insert(invoiceItemsToInsert);

          if (itemInsertError) throw itemInsertError;
        }

        // Create ledger entry
        await supabase.from('ledger_entries').insert({
          center_id: centerId,
          student_id: student.id,
          entry_type: 'invoice',
          reference_id: invoice.id,
          reference_table: 'invoices',
          amount: totalAmount,
          entry_date: invoiceDate.toISOString().split('T')[0],
          description: `Monthly invoice for ${invoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        });

        invoicesGenerated++;
      } catch (error) {
        errors.push(`Error for student ${student.id}: ${error.message}`);
      }
    }

    // Log the generation
    await supabase.from('invoice_generation_logs').insert({
      center_id: centerId,
      generation_date: invoiceDate.toISOString().split('T')[0],
      invoices_generated: invoicesGenerated,
      status: errors.length === 0 ? 'success' : 'partial',
      error_message: errors.length > 0 ? errors.join('; ') : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoicesGenerated,
        errors: errors.length > 0 ? errors : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

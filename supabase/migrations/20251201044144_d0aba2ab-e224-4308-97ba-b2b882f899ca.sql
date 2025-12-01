-- Fix ambiguous column references in generate_monthly_invoices_sql function
-- Add table aliases to prevent "column reference is ambiguous" error

CREATE OR REPLACE FUNCTION public.generate_monthly_invoices_sql(
    p_center_id uuid,
    p_month integer,
    p_year integer,
    p_academic_year text,
    p_due_in_days integer DEFAULT 30,
    p_late_fee_per_day numeric DEFAULT 0
)
RETURNS TABLE(
    invoice_id uuid,
    invoice_number text,
    student_id uuid,
    student_name text,
    total_amount numeric
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_invoice_date DATE := make_date(p_year, p_month, 1);
    v_due_date DATE := v_invoice_date + INTERVAL '1 day' * p_due_in_days;
    v_student_record RECORD;
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_total_invoice_amount NUMERIC;
    v_sequence INT;
    v_existing_invoice_count INT;
BEGIN
    -- Check if invoices already exist for this month/year for the given center
    SELECT COUNT(*)
    INTO v_existing_invoice_count
    FROM public.invoices inv
    WHERE inv.center_id = p_center_id
      AND inv.invoice_month = p_month
      AND inv.invoice_year = p_year
      AND inv.status != 'cancelled';

    IF v_existing_invoice_count > 0 THEN
        RAISE NOTICE 'Invoices already exist for center % for month %/%s. Skipping generation.', p_center_id, p_month, p_year;
        RETURN;
    END IF;

    -- Loop through students with active fee assignments for the academic year
    FOR v_student_record IN
        SELECT
            s.id AS student_id,
            s.name AS student_name
        FROM
            public.students s
        WHERE
            s.center_id = p_center_id
            AND s.status = 'active'
    LOOP
        -- Calculate total amount for the current student's invoice based on active fee assignments
        SELECT COALESCE(SUM(sfa_inner.amount), 0)
        INTO v_total_invoice_amount
        FROM public.student_fee_assignments sfa_inner
        JOIN public.fee_structures fs_inner ON sfa_inner.fee_structure_id = fs_inner.id
        WHERE sfa_inner.student_id = v_student_record.student_id
          AND sfa_inner.is_active = TRUE
          AND sfa_inner.academic_year = p_academic_year
          AND fs_inner.is_active = TRUE
          AND fs_inner.academic_year = p_academic_year
          AND v_invoice_date BETWEEN fs_inner.effective_from AND COALESCE(fs_inner.effective_to, '9999-12-31'::DATE);

        -- Only create an invoice if there's a positive total amount
        IF v_total_invoice_amount > 0 THEN
            -- Generate invoice number
            SELECT COALESCE(MAX(CAST(SUBSTRING(inv2.invoice_number FROM 15 FOR 4) AS INT)), 0) + 1
            INTO v_sequence
            FROM public.invoices inv2
            WHERE inv2.center_id = p_center_id
              AND inv2.invoice_month = p_month
              AND inv2.invoice_year = p_year;

            v_invoice_number := 'INV-' || UPPER(SUBSTRING(REPLACE(p_center_id::TEXT, '-', ''), 1, 4)) || '-' || 
                               TO_CHAR(p_year, 'FM0000') || TO_CHAR(p_month, 'FM00') || '-' || LPAD(v_sequence::TEXT, 4, '0');

            -- Create invoice record
            INSERT INTO public.invoices (
                center_id,
                student_id,
                invoice_number,
                invoice_month,
                invoice_year,
                invoice_date,
                due_date,
                total_amount,
                paid_amount,
                status,
                academic_year,
                late_fee_per_day
            ) VALUES (
                p_center_id,
                v_student_record.student_id,
                v_invoice_number,
                p_month,
                p_year,
                v_invoice_date,
                v_due_date,
                v_total_invoice_amount,
                0,
                'issued',
                p_academic_year,
                p_late_fee_per_day
            )
            RETURNING id INTO v_invoice_id;

            -- Add invoice items
            INSERT INTO public.invoice_items (
                invoice_id,
                fee_heading_id,
                description,
                quantity,
                unit_amount,
                total_amount
            )
            SELECT
                v_invoice_id,
                sfa_inner.fee_heading_id,
                fh_inner.heading_name,
                1,
                sfa_inner.amount,
                sfa_inner.amount
            FROM
                public.student_fee_assignments sfa_inner
            JOIN
                public.fee_headings fh_inner ON sfa_inner.fee_heading_id = fh_inner.id
            JOIN
                public.fee_structures fs_inner ON sfa_inner.fee_structure_id = fs_inner.id
            WHERE
                sfa_inner.student_id = v_student_record.student_id
                AND sfa_inner.is_active = TRUE
                AND sfa_inner.academic_year = p_academic_year
                AND fs_inner.is_active = TRUE
                AND fs_inner.academic_year = p_academic_year
                AND v_invoice_date BETWEEN fs_inner.effective_from AND COALESCE(fs_inner.effective_to, '9999-12-31'::DATE);

            -- Create ledger entries for Accounts Receivable (Debit) and Fee Revenue (Credit)
            INSERT INTO public.ledger_entries (
                center_id,
                transaction_date,
                transaction_type,
                reference_type,
                reference_id,
                account_code,
                account_name,
                debit_amount,
                credit_amount,
                description,
                created_by_user_id
            ) VALUES
            (
                p_center_id,
                v_invoice_date,
                'fee_invoice',
                'invoice',
                v_invoice_id,
                '1301',
                'Accounts Receivable',
                v_total_invoice_amount,
                0,
                'Invoice ' || v_invoice_number || ' generated for ' || v_student_record.student_name,
                NULL
            ),
            (
                p_center_id,
                v_invoice_date,
                'fee_invoice',
                'invoice',
                v_invoice_id,
                '4101',
                'Tuition Fee Revenue',
                0,
                v_total_invoice_amount,
                'Revenue from invoice ' || v_invoice_number || ' for ' || v_student_record.student_name,
                NULL
            );

            -- Return generated invoice details
            invoice_id := v_invoice_id;
            invoice_number := v_invoice_number;
            student_id := v_student_record.student_id;
            student_name := v_student_record.student_name;
            total_amount := v_total_invoice_amount;
            RETURN NEXT;
        END IF;
    END LOOP;

END;
$function$;
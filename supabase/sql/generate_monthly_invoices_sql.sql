CREATE OR REPLACE FUNCTION public.generate_monthly_invoices_sql(
    p_center_id UUID,
    p_month INT,
    p_year INT,
    p_academic_year TEXT,
    p_due_in_days INT DEFAULT 30,
    p_late_fee_per_day NUMERIC DEFAULT 0
)
RETURNS TABLE (
    invoice_id UUID,
    invoice_number TEXT,
    student_id UUID,
    student_name TEXT,
    total_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice_date DATE;
    v_due_date DATE;
    v_student RECORD;
    v_fee_assignment RECORD;
    v_total_amount NUMERIC;
    v_invoice_number TEXT;
    v_new_invoice_id UUID;
    v_invoice_counter INT := 1;
    v_existing_invoices_count INT;
    v_summary_id UUID;
    v_current_total_invoiced NUMERIC;
BEGIN
    -- Check if invoices already exist for this month and center
    SELECT COUNT(id)
    INTO v_existing_invoices_count
    FROM public.invoices
    WHERE center_id = p_center_id
      AND invoice_month = p_month
      AND invoice_year = p_year;

    IF v_existing_invoices_count > 0 THEN
        RAISE NOTICE 'Invoices already exist for %/% in center %. Skipping generation.', p_month, p_year, p_center_id;
        RETURN; -- Exit function if invoices already exist
    END IF;

    -- Set invoice and due dates
    v_invoice_date := MAKE_DATE(p_year, p_month, 1);
    v_due_date := v_invoice_date + INTERVAL '1 day' * p_due_in_days;

    -- Get all active students for this center
    FOR v_student IN
        SELECT id, name, grade
        FROM public.students
        WHERE center_id = p_center_id
    LOOP
        -- Get active fee assignments for this student and academic year
        SELECT SUM(sfa.amount)
        INTO v_total_amount
        FROM public.student_fee_assignments sfa
        WHERE sfa.student_id = v_student.id
          AND sfa.academic_year = p_academic_year
          AND sfa.is_active = TRUE;

        IF v_total_amount IS NULL OR v_total_amount = 0 THEN
            RAISE NOTICE 'No active fee assignments for student % (ID: %). Skipping invoice generation.', v_student.name, v_student.id;
            CONTINUE; -- Skip to next student
        END IF;

        -- Generate invoice number
        v_invoice_number := FORMAT('INV-%s-%s%s-%s', LEFT(REPLACE(p_center_id::TEXT, '-', ''), 4), p_year, LPAD(p_month::TEXT, 2, '0'), LPAD(v_invoice_counter::TEXT, 4, '0'));

        -- Insert invoice
        INSERT INTO public.invoices (
            center_id, student_id, invoice_number, invoice_month, invoice_year,
            invoice_date, due_date, total_amount, paid_amount, status, academic_year,
            notes, late_fee_per_day
        )
        VALUES (
            p_center_id, v_student.id, v_invoice_number, p_month, p_year,
            v_invoice_date, v_due_date, v_total_amount, 0, 'issued', p_academic_year,
            FORMAT('Monthly invoice for %s %s', TO_CHAR(v_invoice_date, 'Month'), p_year),
            p_late_fee_per_day
        )
        RETURNING id INTO v_new_invoice_id;

        -- Insert invoice items
        FOR v_fee_assignment IN
            SELECT sfa.amount, fh.heading_name
            FROM public.student_fee_assignments sfa
            JOIN public.fee_headings fh ON sfa.fee_heading_id = fh.id
            WHERE sfa.student_id = v_student.id
              AND sfa.academic_year = p_academic_year
              AND sfa.is_active = TRUE
        LOOP
            INSERT INTO public.invoice_items (
                invoice_id, fee_heading_id, description, quantity, unit_amount, total_amount
            )
            VALUES (
                v_new_invoice_id, v_fee_assignment.fee_heading_id, v_fee_assignment.heading_name,
                1, v_fee_assignment.amount, v_fee_assignment.amount
            );
        END LOOP;

        -- Create ledger entry for Accounts Receivable (Debit)
        INSERT INTO public.ledger_entries (
            center_id, transaction_date, transaction_type, reference_type, reference_id,
            account_code, account_name, debit_amount, credit_amount, description
        )
        VALUES (
            p_center_id, v_invoice_date, 'fee_invoice', 'invoice', v_new_invoice_id,
            '1301', 'Accounts Receivable', v_total_amount, 0,
            FORMAT('Invoice %s for %s', v_invoice_number, v_student.name)
        );

        -- Create ledger entry for Fee Revenue (Credit)
        INSERT INTO public.ledger_entries (
            center_id, transaction_date, transaction_type, reference_type, reference_id,
            account_code, account_name, debit_amount, credit_amount, description
        )
        VALUES (
            p_center_id, v_invoice_date, 'fee_invoice', 'invoice', v_new_invoice_id,
            '4101', 'Fee Revenue', 0, v_total_amount,
            FORMAT('Revenue from invoice %s for %s', v_invoice_number, v_student.name)
        );

        -- Add to result table
        RETURN QUERY SELECT v_new_invoice_id, v_invoice_number, v_student.id, v_student.name, v_total_amount;

        v_invoice_counter := v_invoice_counter + 1;
    END LOOP;

    -- Update or create financial summary for this month
    SELECT id, total_invoiced
    INTO v_summary_id, v_current_total_invoiced
    FROM public.financial_summaries
    WHERE center_id = p_center_id
      AND summary_month = p_month
      AND summary_year = p_year;

    IF v_summary_id IS NOT NULL THEN
        -- Update existing summary
        UPDATE public.financial_summaries
        SET
            total_invoiced = v_current_total_invoiced + (SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            total_outstanding = total_outstanding + (SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            net_balance = net_balance - (SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            last_updated = NOW()
        WHERE id = v_summary_id;
    ELSE
        -- Create new summary
        INSERT INTO public.financial_summaries (
            center_id, summary_month, summary_year, total_invoiced, total_collected,
            total_outstanding, total_expenses, net_balance, generated_at, last_updated
        )
        VALUES (
            p_center_id, p_month, p_year,
            (SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            0,
            (SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            0,
            -(SELECT SUM(total_amount) FROM public.invoices WHERE center_id = p_center_id AND invoice_month = p_month AND invoice_year = p_year),
            NOW(), NOW()
        );
    END IF;

END;
$$;
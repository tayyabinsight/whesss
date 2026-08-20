-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT,
    parent_name TEXT,
    class TEXT,
    fee_months TEXT[], -- Array of months like ['January 2024', 'February 2024']
    fee_items JSONB, -- Array of {description: string, amount: number}
    total_amount NUMERIC NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    fine_amount NUMERIC DEFAULT 0,
    bank_account_no TEXT,
    bank_iban TEXT,
    status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON public.invoices(invoice_no);

-- Disable RLS for now as requested for the rest of the project
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

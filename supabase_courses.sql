-- Updated Course Management Schema with Real-time Support and Global Settings

-- 1. Global Course Settings (for invoice numbers etc)
CREATE TABLE IF NOT EXISTS public.course_global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    next_invoice_number INTEGER DEFAULT 1001,
    invoice_prefix TEXT DEFAULT 'CRS-',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Course Assignments table (Settings per class)
CREATE TABLE IF NOT EXISTS public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name TEXT NOT NULL UNIQUE, -- e.g. "Mont.", "Nursery", "Class 1"
    books JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name: string, price: number, stock: number}
    copies JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name: string, qty: number, price: number, stock: number}
    full_course_amount NUMERIC NOT NULL DEFAULT 0, -- Auto-calculated from books price sum
    full_copies_amount NUMERIC NOT NULL DEFAULT 0, -- Auto-calculated from copies price sum
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Course Invoices table
CREATE TABLE IF NOT EXISTS public.course_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    father_name TEXT,
    class_name TEXT NOT NULL,
    student_type TEXT, -- 'New Admission' | 'Existing Student'
    invoice_type TEXT NOT NULL, -- 'Full Course' | 'Only Copies'
    books_given JSONB NOT NULL DEFAULT '[]'::jsonb, -- List of book names given
    copies_given JSONB NOT NULL DEFAULT '[]'::jsonb, -- List of {name, qty} given
    subtotal_amount NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    remaining_balance NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE public.course_global_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_invoices DISABLE ROW LEVEL SECURITY;

-- Insert default settings if not exists
INSERT INTO public.course_global_settings (next_invoice_number)
SELECT 1001 WHERE NOT EXISTS (SELECT 1 FROM public.course_global_settings);

-- WISDOM HOUSE - SALARY & STAFF ENHANCEMENTS
-- =============================================

-- 1. Unified Staff/Employee Table (Optional but recommended)
-- If we want to keep teachers separate, we can, but let's add a staff_members table for non-teaching staff.
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- e.g. 'Admin', 'Security', 'Maintenance'
    base_salary NUMERIC DEFAULT 0,
    phone TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add base_salary to teachers if not present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='base_salary') THEN
        ALTER TABLE public.teachers ADD COLUMN base_salary NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Enhanced Salaries Table
-- We will use this to store the monthly payroll records
CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    base_salary NUMERIC DEFAULT 0,
    bonus NUMERIC DEFAULT 0,
    deductions NUMERIC DEFAULT 0,
    net_pay NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'processing'
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    
    -- Deduction Details (Rules)
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    weekend_absent_count INTEGER DEFAULT 0,
    custom_deduction NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS or Disable (Keeping consistency with previous scripts)
ALTER TABLE public.staff_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries DISABLE ROW LEVEL SECURITY;

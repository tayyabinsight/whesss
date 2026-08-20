-- Paste and run this script in your Supabase project's SQL Editor

-- 1. Create the Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL, -- The assigned email, e.g. ali@whes.students.com
    full_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    guardian_name TEXT,
    contact_number TEXT,
    secondary_phone TEXT,
    home_address TEXT,
    status TEXT DEFAULT 'active',
    base_fee NUMERIC DEFAULT 0,
    fee_type TEXT,
    fee_total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Turn off Row Level Security (RLS) temporarily so your Admin frontend can freely insert/read records without getting blocked.
-- (In a fully production app, you would enable this and add an Admin-only policy)
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

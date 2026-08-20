-- Paste and run this script in your Supabase project's SQL Editor

-- 1. Create the Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL UNIQUE, -- Custom Auth Email (e.g., ali@wisdom.faculty.com)
    full_name TEXT NOT NULL,
    subject TEXT,
    qualification TEXT,
    phone TEXT,
    contract TEXT DEFAULT 'Full-Time',
    status TEXT DEFAULT 'active',
    performance NUMERIC DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Turn off Row Level Security (RLS) temporarily so your Admin frontend can freely insert/read records.
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
